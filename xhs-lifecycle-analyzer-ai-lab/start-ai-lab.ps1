param(
  [switch]$DiagnoseOnly
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppUrl = "http://127.0.0.1:8787"
$HealthUrl = "$AppUrl/api/health"
$Port = 8787
$ServiceName = "xhs-lifecycle-analyzer-ai-lab"
$DefaultApiUrl = "https://api.deepseek.com/chat/completions"
$DefaultModel = "deepseek-v4-pro"
$DefaultMaxTokens = "16000"
$DefaultAutoContinueLimit = "3"

function Write-Step {
  param([string]$Message)
  Write-Host "[AI分析器] $Message" -ForegroundColor Cyan
}

function Fail-Friendly {
  param([string]$Message)
  Write-Host ""
  Write-Host "启动失败：$Message" -ForegroundColor Red
  exit 1
}

function Test-NodeAvailable {
  try {
    $version = & node -v
    if (-not $version) {
      return $false
    }
    Write-Step "检测到 Node：$version"
    return $true
  } catch {
    return $false
  }
}

function Get-CommandVersion {
  param([string]$CommandName)
  try {
    $version = & $CommandName -v
    if ($version) {
      return [string]$version
    }
    return "未检测到"
  } catch {
    return "未检测到"
  }
}

function Test-PortOpen {
  param([int]$PortNumber)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $PortNumber, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(800, $false)
    if ($connected) {
      $client.EndConnect($async)
      return $true
    }
    return $false
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Get-Health {
  try {
    return Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
  } catch {
    return $null
  }
}

function Read-EnvMap {
  param([string]$EnvPath)
  $map = @{}
  if (-not (Test-Path -LiteralPath $EnvPath)) {
    return $map
  }
  Get-Content -LiteralPath $EnvPath -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }
    $index = $line.IndexOf("=")
    if ($index -lt 1) {
      return
    }
    $key = $line.Substring(0, $index).Trim()
    $value = $line.Substring($index + 1).Trim()
    $map[$key] = $value
  }
  return $map
}

function Test-PlaceholderKey {
  param([string]$Value)
  if (-not $Value) {
    return $true
  }
  $trimmed = $Value.Trim()
  if (-not $trimmed) {
    return $true
  }
  $placeholders = @(
    "sk-your-deepseek-api-key",
    "请填入你的DeepSeek API Key",
    "请填入你的 DeepSeek API Key",
    "你的 DeepSeek API Key",
    "你的DeepSeek API Key"
  )
  return $placeholders -contains $trimmed
}

function Save-EnvFile {
  param(
    [string]$EnvPath,
    [string]$ApiKey
  )
  $lines = @(
    "DEEPSEEK_API_KEY=$ApiKey",
    "DEEPSEEK_MODEL=$DefaultModel",
    "DEEPSEEK_API_URL=$DefaultApiUrl",
    "DEEPSEEK_MAX_TOKENS=$DefaultMaxTokens",
    "DEEPSEEK_AUTO_CONTINUE_LIMIT=$DefaultAutoContinueLimit",
    "PORT=$Port"
  )
  Set-Content -LiteralPath $EnvPath -Value $lines -Encoding UTF8
}

function Ensure-EnvConfig {
  $envPath = Join-Path $ProjectDir ".env"
  $examplePath = Join-Path $ProjectDir ".env.example"

  if (-not (Test-Path -LiteralPath $envPath)) {
    Write-Step "未发现 .env，准备创建本地配置文件。"
    if (Test-Path -LiteralPath $examplePath) {
      Copy-Item -LiteralPath $examplePath -Destination $envPath
    }
  }

  $envMap = Read-EnvMap -EnvPath $envPath
  $apiKey = ""
  if ($envMap.ContainsKey("DEEPSEEK_API_KEY")) {
    $apiKey = [string]$envMap["DEEPSEEK_API_KEY"]
  }

  if (Test-PlaceholderKey -Value $apiKey) {
    Write-Host ""
    Write-Host "第一次使用需要配置 DeepSeek API Key。" -ForegroundColor Yellow
    Write-Host "请输入你的 DeepSeek API Key，输入时会显示在当前窗口，请确认周围环境安全。" -ForegroundColor Yellow
    $apiKey = Read-Host "DeepSeek API Key"
    $apiKey = $apiKey.Trim()
    if (Test-PlaceholderKey -Value $apiKey) {
      Fail-Friendly "没有填写有效的 DeepSeek API Key。"
    }
    Save-EnvFile -EnvPath $envPath -ApiKey $apiKey
    Write-Step ".env 已保存。以后双击启动时不需要重复输入 Key。"
    return
  }

  Save-EnvFile -EnvPath $envPath -ApiKey $apiKey.Trim()
  Write-Step ".env 已检查：API Key 已配置，模型固定为 $DefaultModel。"
}

function Get-KeyStatus {
  $envPath = Join-Path $ProjectDir ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    return "未配置（没有 .env）"
  }
  $envMap = Read-EnvMap -EnvPath $envPath
  if (-not $envMap.ContainsKey("DEEPSEEK_API_KEY")) {
    return "未配置（缺少 DEEPSEEK_API_KEY）"
  }
  if (Test-PlaceholderKey -Value ([string]$envMap["DEEPSEEK_API_KEY"])) {
    return "未配置（Key 为空或仍是占位符）"
  }
  return "已配置"
}

function Get-EnvModel {
  $envPath = Join-Path $ProjectDir ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    return "未配置"
  }
  $envMap = Read-EnvMap -EnvPath $envPath
  if ($envMap.ContainsKey("DEEPSEEK_MODEL")) {
    return [string]$envMap["DEEPSEEK_MODEL"]
  }
  return "未配置"
}

function Get-EnvMaxTokens {
  $envPath = Join-Path $ProjectDir ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    return "未配置"
  }
  $envMap = Read-EnvMap -EnvPath $envPath
  if ($envMap.ContainsKey("DEEPSEEK_MAX_TOKENS")) {
    return [string]$envMap["DEEPSEEK_MAX_TOKENS"]
  }
  return "未配置"
}

function Get-EnvAutoContinueLimit {
  $envPath = Join-Path $ProjectDir ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    return "未配置"
  }
  $envMap = Read-EnvMap -EnvPath $envPath
  if ($envMap.ContainsKey("DEEPSEEK_AUTO_CONTINUE_LIMIT")) {
    return [string]$envMap["DEEPSEEK_AUTO_CONTINUE_LIMIT"]
  }
  return "未配置"
}

function Get-DeepSeekTest {
  try {
    return Invoke-RestMethod -Uri "$AppUrl/api/deepseek-test" -Method Get -TimeoutSec 45
  } catch {
    if ($_.Exception.Response) {
      try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $text = $reader.ReadToEnd()
        if ($text) {
          return $text | ConvertFrom-Json
        }
      } catch {}
    }
    return $null
  }
}

function Show-Diagnostics {
  Set-Location -LiteralPath $ProjectDir
  $envModel = Get-EnvModel
  $envMaxTokens = Get-EnvMaxTokens
  $envAutoContinueLimit = Get-EnvAutoContinueLimit
  Write-Host ""
  Write-Host "===== 小红书分析器 AI 实验版诊断 =====" -ForegroundColor Cyan
  Write-Host "当前目录：$ProjectDir"
  Write-Host "Node 版本：$(Get-CommandVersion -CommandName 'node')"
  Write-Host "npm 版本：$(Get-CommandVersion -CommandName 'npm')"
  Write-Host "package.json：$(if (Test-Path -LiteralPath (Join-Path $ProjectDir 'package.json')) { '存在' } else { '不存在' })"
  Write-Host "server.js：$(if (Test-Path -LiteralPath (Join-Path $ProjectDir 'server.js')) { '存在' } else { '不存在' })"
  Write-Host ".env：$(if (Test-Path -LiteralPath (Join-Path $ProjectDir '.env')) { '存在' } else { '不存在' })"
  Write-Host "DEEPSEEK_API_KEY：$(Get-KeyStatus)"
  Write-Host "DEEPSEEK_MODEL：$envModel"
  Write-Host "正确模型名应为：$DefaultModel"
  Write-Host "DEEPSEEK_MAX_TOKENS：$envMaxTokens"
  Write-Host "DEEPSEEK_AUTO_CONTINUE_LIMIT：$envAutoContinueLimit"
  if ($envModel -eq "deepseekv4pro") {
    Write-Host "模型名提示：检测到旧模型 deepseekv4pro，需要改为 $DefaultModel。" -ForegroundColor Yellow
  }
  Write-Host "8787 端口：$(if (Test-PortOpen -PortNumber $Port) { '已占用' } else { '未占用' })"
  $health = Get-Health
  if ($health) {
    Write-Host "/api/health：可访问"
    Write-Host "health.ok：$($health.ok)"
    Write-Host "health.service：$($health.service)"
    Write-Host "health.model：$($health.model)"
    Write-Host "health.maxTokens：$($health.maxTokens)"
    Write-Host "health.autoContinueLimit：$($health.autoContinueLimit)"
    Write-Host "health.keyConfigured：$($health.keyConfigured)"
    if ($health.model -ne $DefaultModel) {
      Write-Host "health 模型提示：当前运行中的后端模型不是 $DefaultModel，请重启后端。" -ForegroundColor Yellow
    }
    if ($health.keyConfigured -eq $true) {
      Write-Host "DeepSeek 连接测试：正在请求 /api/deepseek-test ..."
      $testResult = Get-DeepSeekTest
      if ($testResult) {
        Write-Host "deepseek-test.ok：$($testResult.ok)"
        Write-Host "deepseek-test.status：$($testResult.status)"
        Write-Host "deepseek-test.model：$($testResult.model)"
        Write-Host "deepseek-test.message：$($testResult.message)"
      } else {
        Write-Host "deepseek-test：请求失败或无返回。"
      }
    }
  } else {
    Write-Host "/api/health：不可访问"
  }
  Write-Host "======================================"
  Write-Host ""
}

function Start-Backend {
  $outLog = Join-Path $ProjectDir "server-output.log"
  $errLog = Join-Path $ProjectDir "server-error.log"
  if (Test-Path -LiteralPath $outLog) {
    Remove-Item -LiteralPath $outLog -Force
  }
  if (Test-Path -LiteralPath $errLog) {
    Remove-Item -LiteralPath $errLog -Force
  }

  Write-Step "正在启动本地后端..."
  $process = Start-Process -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $ProjectDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  for ($i = 0; $i -lt 25; $i += 1) {
    Start-Sleep -Milliseconds 400
    $health = Get-Health
    if ($health -and $health.ok -eq $true -and $health.service -eq $ServiceName) {
      Write-Step "本地后端已启动。"
      return
    }
    if ($process.HasExited) {
      $errorText = ""
      if (Test-Path -LiteralPath $errLog) {
        $errorText = (Get-Content -LiteralPath $errLog -Encoding UTF8 -Raw).Trim()
      }
      if (-not $errorText) {
        $errorText = "server.js 已退出，但没有返回详细错误。"
      }
      Fail-Friendly "后端启动失败。错误信息：$errorText"
    }
  }

  Fail-Friendly "后端启动超时。请检查 server-error.log。"
}

try {
  Set-Location -LiteralPath $ProjectDir
  if ($DiagnoseOnly) {
    Show-Diagnostics
    exit 0
  }

  Write-Step "正在启动小红书分析器 AI 实验版..."
  Write-Step "项目目录：$ProjectDir"

  if (-not (Test-Path -LiteralPath (Join-Path $ProjectDir "package.json"))) {
    Fail-Friendly "当前目录缺少 package.json，请确认脚本放在 AI 实验版文件夹里。"
  }
  if (-not (Test-Path -LiteralPath (Join-Path $ProjectDir "server.js"))) {
    Fail-Friendly "当前目录缺少 server.js，请确认 AI 实验版文件完整。"
  }
  Write-Step "正在检查 Node..."
  if (-not (Test-NodeAvailable)) {
    Fail-Friendly "没有检测到 Node.js。请先安装 Node.js，然后重新双击启动。"
  }

  Write-Step "正在检查 .env..."
  Ensure-EnvConfig

  Write-Step "正在检查后端是否已经启动..."
  $health = Get-Health
  if ($health -and $health.ok -eq $true -and $health.service -eq $ServiceName) {
    if ($health.model -ne $DefaultModel) {
      Fail-Friendly "检测到后端已经在运行，但当前模型是 $($health.model)，不是 $DefaultModel。请先关闭旧的 node 后端进程，再重新双击启动。"
    }
    Write-Step "检测到后端已经在运行，直接打开浏览器。"
    Write-Step "正在打开浏览器..."
    Start-Process $AppUrl
    exit 0
  }

  Write-Step "正在检查 8787 端口..."
  if (Test-PortOpen -PortNumber $Port) {
    Fail-Friendly "8787 端口已被其他程序占用，但不是当前 AI 分析器后端。请关闭占用端口的程序，或修改 .env 中的 PORT 后再启动。"
  }

  Start-Backend
  Write-Step "正在打开浏览器..."
  Start-Process $AppUrl
  Write-Step "浏览器已打开：$AppUrl"
  exit 0
} catch {
  Fail-Friendly $_.Exception.Message
}
