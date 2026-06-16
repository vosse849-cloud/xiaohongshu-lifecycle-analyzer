const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = __dirname;
const HOST = "127.0.0.1";
const BODY_LIMIT = 1024 * 1024;
const SERVICE_NAME = "xhs-lifecycle-analyzer-ai-lab";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-pro";
const DEFAULT_DEEPSEEK_MAX_TOKENS = 16000;
const FALLBACK_DEEPSEEK_MAX_TOKENS = 8000;
const DEFAULT_AUTO_CONTINUE_LIMIT = 3;

loadEnvFile(path.join(ROOT_DIR, ".env"));

const PORT = Number(process.env.PORT || 8787);
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;
const DEEPSEEK_MAX_TOKENS = parsePositiveInteger(process.env.DEEPSEEK_MAX_TOKENS, DEFAULT_DEEPSEEK_MAX_TOKENS);
const DEEPSEEK_AUTO_CONTINUE_LIMIT = parsePositiveInteger(process.env.DEEPSEEK_AUTO_CONTINUE_LIMIT, DEFAULT_AUTO_CONTINUE_LIMIT);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon"
};

const server = http.createServer(function (req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: SERVICE_NAME,
      keyConfigured: isConfiguredApiKey(DEEPSEEK_API_KEY),
      model: DEEPSEEK_MODEL,
      maxTokens: DEEPSEEK_MAX_TOKENS,
      autoContinueLimit: DEEPSEEK_AUTO_CONTINUE_LIMIT
    });
    return;
  }

  if (req.url === "/api/ai-recap" && req.method === "POST") {
    handleAiRecap(req, res);
    return;
  }

  if (req.url === "/api/deepseek-test" && req.method === "GET") {
    handleDeepSeekTest(res);
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, HOST, function () {
  console.log("AI lab server running at http://" + HOST + ":" + PORT);
  if (!DEEPSEEK_API_KEY) {
    console.log("DEEPSEEK_API_KEY is not configured. AI recap calls will fail until .env is set.");
  }
});

function handleAiRecap(req, res) {
  readJsonBody(req)
    .then(function (requestBody) {
      var dataPackage = requestBody && requestBody.dataPackage;
      if (!dataPackage || (!dataPackage.singleCsv && !dataPackage.multiSnapshot)) {
        sendJson(res, 400, {
          ok: false,
          error: "AI 分析失败：缺少可分析的数据包"
        });
        return null;
      }

      if (!isConfiguredApiKey(DEEPSEEK_API_KEY)) {
        sendJson(res, 500, {
          ok: false,
          error: "DeepSeek API Key 未配置",
          status: 500,
          message: "请先在 .env 中配置有效的 DEEPSEEK_API_KEY。",
          model: DEEPSEEK_MODEL
        });
        return null;
      }

      return callDeepSeek(dataPackage).then(function (result) {
        sendJson(res, 200, {
          ok: true,
          content: result.content,
          model: DEEPSEEK_MODEL,
          finishReason: result.finishReason,
          configuredMaxTokens: result.configuredMaxTokens,
          actualMaxTokens: result.actualMaxTokens,
          autoContinued: result.autoContinued,
          continueCount: result.continueCount,
          possibleTruncated: result.possibleTruncated,
          usage: result.usage || null,
          warning: result.warning || ""
        });
      });
    })
    .catch(function (error) {
      logDeepSeekError(error);
      if (!res.headersSent) {
        sendJson(res, error.status || 502, buildSafeDeepSeekError(error));
      }
    });
}

function handleDeepSeekTest(res) {
  if (!isConfiguredApiKey(DEEPSEEK_API_KEY)) {
    sendJson(res, 500, {
      ok: false,
      error: "DeepSeek API Key 未配置",
      status: 500,
      message: "请先在 .env 中配置有效的 DEEPSEEK_API_KEY。",
      model: DEEPSEEK_MODEL
    });
    return;
  }

  callDeepSeekTest()
    .then(function (result) {
      sendJson(res, 200, {
        ok: true,
        model: DEEPSEEK_MODEL,
        status: 200,
        finishReason: result.finishReason,
        actualMaxTokens: result.actualMaxTokens,
        usage: result.usage || null,
        message: result.content || "连接成功"
      });
    })
    .catch(function (error) {
      logDeepSeekError(error);
      sendJson(res, error.status || 502, buildSafeDeepSeekError(error));
    });
}

function callDeepSeek(dataPackage) {
  var messages = [
    {
      role: "system",
      content: [
        "你是小红书内容运营复盘助手。",
        "你只根据用户提供的结构化分析数据包生成复盘建议。",
        "不要重新计算 CSV 原始数据，不要声称看过完整 CSV。",
        "不要使用绝对结论。尾流相关必须使用“疑似”“可能”“需要连续快照确认”。",
        "输出中文，口吻务实，适合复制到飞书、Excel 复盘表或运营记录。",
        "默认控制在 600-1000 字，结构清楚。"
      ].join("\n")
    },
    {
      role: "user",
      content: [
        "请根据下面的小红书分析摘要，生成 AI 复盘结论。",
        "",
        "输出结构必须包含：",
        "1. 当前账号整体状态判断",
        "2. 重点作品分析",
        "3. 放量作品判断",
        "4. 疑似尾流风险",
        "5. 是否建议继续发布新作品",
        "6. 哪些选题值得复用",
        "7. 哪些作品暂不建议复用",
        "8. 下一步运营动作建议",
        "9. 注意事项",
        "",
        "数据包：",
        JSON.stringify(dataPackage, null, 2)
      ].join("\n")
    }
  ];

  return callDeepSeekWithStrategy(messages);
}

function callDeepSeekTest() {
  return callDeepSeekChat([
    {
      role: "system",
      content: "你是连通性测试助手。"
    },
    {
      role: "user",
      content: "请回复：连接成功"
    }
  ], 64);
}

async function callDeepSeekWithStrategy(initialMessages) {
  var configuredMaxTokens = DEEPSEEK_MAX_TOKENS;
  var actualMaxTokens = configuredMaxTokens;
  var warnings = [];
  var firstResult;
  var totalUsage = createEmptyUsage();

  try {
    firstResult = await callDeepSeekChat(initialMessages, actualMaxTokens);
  } catch (error) {
    if (actualMaxTokens > FALLBACK_DEEPSEEK_MAX_TOKENS && isMaxTokensLimitError(error)) {
      actualMaxTokens = FALLBACK_DEEPSEEK_MAX_TOKENS;
      warnings.push("当前模型不支持设置的 max_tokens，已自动降级为 8000 后重试。");
      firstResult = await callDeepSeekChat(initialMessages, actualMaxTokens);
    } else {
      throw error;
    }
  }

  var contentParts = [firstResult.content];
  var finishReason = firstResult.finishReason;
  totalUsage = mergeUsage(totalUsage, firstResult.usage);
  var continueCount = 0;
  var messages = initialMessages.concat([
    {
      role: "assistant",
      content: firstResult.content
    }
  ]);

  while (isLengthFinishReason(finishReason) && continueCount < DEEPSEEK_AUTO_CONTINUE_LIMIT) {
    continueCount += 1;
    messages.push({
      role: "user",
      content: "请从上一段结尾继续写，不要重复前文，继续完成未写完的复盘结论。"
    });
    var continuedResult = await callDeepSeekChat(messages, actualMaxTokens);
    contentParts.push(continuedResult.content);
    finishReason = continuedResult.finishReason;
    totalUsage = mergeUsage(totalUsage, continuedResult.usage);
    messages.push({
      role: "assistant",
      content: continuedResult.content
    });
  }

  var possibleTruncated = isLengthFinishReason(finishReason);
  if (possibleTruncated) {
    warnings.push("AI 结论可能仍未完整，建议减少输入快照数量或继续提高 max_tokens。");
  }

  return {
    content: contentParts.join("\n\n"),
    finishReason: finishReason || "",
    configuredMaxTokens: configuredMaxTokens,
    actualMaxTokens: actualMaxTokens,
    autoContinued: continueCount > 0,
    continueCount: continueCount,
    possibleTruncated: possibleTruncated,
    usage: hasUsage(totalUsage) ? totalUsage : null,
    warning: warnings.join(" ")
  };
}

function callDeepSeekChat(messages, maxTokens) {
  var body = JSON.stringify({
    model: DEEPSEEK_MODEL,
    messages: messages,
    temperature: 0.3,
    max_tokens: maxTokens || DEEPSEEK_MAX_TOKENS,
    stream: false
  });

  return requestJson(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + DEEPSEEK_API_KEY,
      "Content-Length": Buffer.byteLength(body)
    },
    body: body,
    timeoutMs: 90000
  }).then(function (response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw createDeepSeekApiError(response);
    }
    var choice = response.data &&
      response.data.choices &&
      response.data.choices[0];
    var content = choice &&
      choice.message &&
      choice.message.content;
    var finishReason = choice && choice.finish_reason;

    if (!content) {
      var contentError = new Error("DeepSeek API response has no content");
      contentError.status = response.statusCode;
      contentError.deepseekMessage = "DeepSeek 返回成功状态，但没有返回可用文本。";
      contentError.model = DEEPSEEK_MODEL;
      contentError.apiUrl = DEEPSEEK_API_URL;
      throw contentError;
    }
    return {
      content: content.trim(),
      finishReason: finishReason || "",
      actualMaxTokens: maxTokens || DEEPSEEK_MAX_TOKENS,
      usage: normalizeUsage(response.data && response.data.usage),
      warning: isLengthFinishReason(finishReason) ? "AI 结论可能被截断，请提高 max_tokens 或缩短输入数据。" : ""
    };
  });
}

function normalizeUsage(usage) {
  if (!usage || typeof usage !== "object") {
    return null;
  }
  return {
    prompt_tokens: toSafeTokenNumber(usage.prompt_tokens),
    completion_tokens: toSafeTokenNumber(usage.completion_tokens),
    total_tokens: toSafeTokenNumber(usage.total_tokens)
  };
}

function createEmptyUsage() {
  return {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  };
}

function mergeUsage(total, usage) {
  if (!usage) {
    return total;
  }
  total.prompt_tokens += toSafeTokenNumber(usage.prompt_tokens);
  total.completion_tokens += toSafeTokenNumber(usage.completion_tokens);
  total.total_tokens += toSafeTokenNumber(usage.total_tokens);
  return total;
}

function hasUsage(usage) {
  return Boolean(usage) &&
    (usage.prompt_tokens > 0 ||
      usage.completion_tokens > 0 ||
      usage.total_tokens > 0);
}

function toSafeTokenNumber(value) {
  var number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }
  return Math.round(number);
}

function isLengthFinishReason(finishReason) {
  return String(finishReason || "").toLowerCase().indexOf("length") !== -1;
}

function isMaxTokensLimitError(error) {
  var status = Number(error && error.status) || 0;
  var message = [
    error && error.rawDeepSeekMessage,
    error && error.deepseekMessage,
    error && error.message
  ].filter(Boolean).join(" ").toLowerCase();

  if (status !== 400 && status !== 422) {
    return false;
  }
  return /max[_\s-]?tokens|token limit|tokens? exceed|maximum context|context length|too large|超过|超出|最大/.test(message);
}

function createDeepSeekApiError(response) {
  var rawMessage = getDeepSeekErrorMessage(response.data);
  var safeMessage = toSafeDeepSeekMessage(response.statusCode, rawMessage);
  var error = new Error("DeepSeek API 调用失败");
  error.status = response.statusCode;
  error.deepseekMessage = safeMessage;
  error.rawDeepSeekMessage = rawMessage;
  error.model = DEEPSEEK_MODEL;
  error.apiUrl = DEEPSEEK_API_URL;
  return error;
}

function getDeepSeekErrorMessage(data) {
  if (!data) {
    return "";
  }
  if (data.error && data.error.message) {
    return String(data.error.message);
  }
  if (data.message) {
    return String(data.message);
  }
  if (data.raw) {
    return String(data.raw).slice(0, 500);
  }
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch (error) {
    return "";
  }
}

function toSafeDeepSeekMessage(statusCode, rawMessage) {
  if (statusCode === 400) {
    return rawMessage || "模型名无效或请求参数错误。";
  }
  if (statusCode === 401 || statusCode === 403) {
    return rawMessage || "API Key 无效、权限不足或账号未开通该模型。";
  }
  if (statusCode === 404) {
    return rawMessage || "API 地址或模型不存在。";
  }
  if (statusCode === 429) {
    return rawMessage || "请求过于频繁或额度受限。";
  }
  if (statusCode >= 500) {
    return rawMessage || "DeepSeek 服务暂时不可用，请稍后再试。";
  }
  return rawMessage || "DeepSeek API 调用失败，请检查模型名、API Key、网络和账号余额。";
}

function buildSafeDeepSeekError(error) {
  return {
    ok: false,
    error: "DeepSeek API 调用失败",
    status: error.status || 502,
    message: error.deepseekMessage || error.message || "请检查 API Key、模型名、网络连接和账号余额。",
    model: error.model || DEEPSEEK_MODEL
  };
}

function logDeepSeekError(error) {
  console.error("[DeepSeek API Error]");
  console.error("HTTP status:", error.status || "N/A");
  console.error("message:", error.rawDeepSeekMessage || error.deepseekMessage || error.message || "Unknown error");
  console.error("model:", error.model || DEEPSEEK_MODEL);
  console.error("apiUrl:", error.apiUrl || DEEPSEEK_API_URL);
}

function parsePositiveInteger(value, fallback) {
  var parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function requestJson(url, options) {
  return new Promise(function (resolve, reject) {
    var parsedUrl = new URL(url);
    var transport = parsedUrl.protocol === "http:" ? http : https;
    var req = transport.request({
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {}
    }, function (res) {
      var chunks = [];
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", function () {
        var text = Buffer.concat(chunks).toString("utf8");
        var data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          data = {
            raw: text
          };
        }
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(options.timeoutMs || 60000, function () {
      req.destroy(new Error("API request timed out"));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function readJsonBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    var size = 0;

    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error("Request body is too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", function () {
      try {
        var text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(new Error("Request body is not valid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function serveStaticFile(req, res) {
  var url = new URL(req.url, "http://" + HOST + ":" + PORT);
  var pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }

  var filePath = path.normalize(path.join(ROOT_DIR, pathname));
  if (filePath !== ROOT_DIR && !filePath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, function (error, content) {
    if (error) {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    res.end(content);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isConfiguredApiKey(value) {
  var key = String(value || "").trim();
  return Boolean(key) &&
    key !== "sk-your-deepseek-api-key" &&
    key !== "请填入你的DeepSeek API Key" &&
    key !== "请填入你的 DeepSeek API Key" &&
    key !== "你的 DeepSeek API Key" &&
    key !== "你的DeepSeek API Key";
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  var lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.indexOf("#") === 0) {
      return;
    }
    var equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      return;
    }
    var key = trimmed.slice(0, equalIndex).trim();
    var value = trimmed.slice(equalIndex + 1).trim();
    if ((value[0] === "\"" && value[value.length - 1] === "\"") ||
      (value[0] === "'" && value[value.length - 1] === "'")) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}
