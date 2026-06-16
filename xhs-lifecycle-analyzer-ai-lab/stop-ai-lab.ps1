$ErrorActionPreference = "Stop"

$AppUrl = "http://127.0.0.1:8787"
$HealthUrl = "$AppUrl/api/health"
$ServiceName = "xhs-lifecycle-analyzer-ai-lab"
$Port = 8787

function Write-Step {
  param([string]$Message)
  Write-Host "[AI分析器] $Message" -ForegroundColor Cyan
}

function Get-Health {
  try {
    return Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
  } catch {
    return $null
  }
}

function Get-PortPid {
  $lines = & netstat -ano | Select-String ":$Port"
  foreach ($line in $lines) {
    $text = [string]$line
    if ($text -match "LISTENING\s+(\d+)\s*$") {
      return [int]$matches[1]
    }
  }
  return $null
}

try {
  Write-Step "正在检查 8787 端口..."
  $portPid = Get-PortPid
  if (-not $portPid) {
    Write-Host "AI 分析器后端当前没有运行。" -ForegroundColor Yellow
    exit 0
  }

  Write-Step "检测到 8787 端口占用 PID：$portPid"
  Write-Step "正在验证是否为本项目后端..."
  $health = Get-Health
  if (-not $health) {
    Write-Host "8787 端口被其他程序占用，未执行关闭。" -ForegroundColor Yellow
    exit 0
  }
  if ($health.service -ne $ServiceName) {
    Write-Host "8787 端口被其他程序占用，未执行关闭。" -ForegroundColor Yellow
    Write-Host "检测到的 service：$($health.service)"
    exit 0
  }

  Stop-Process -Id $portPid -Force
  Start-Sleep -Milliseconds 500
  Write-Host "AI 分析器后端已关闭。" -ForegroundColor Green
  exit 0
} catch {
  Write-Host "关闭失败：$($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
