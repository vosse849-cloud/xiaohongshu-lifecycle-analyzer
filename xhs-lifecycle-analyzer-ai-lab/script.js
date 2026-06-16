(function () {
  var requiredHeaders = [
    "笔记标题",
    "首次发布时间",
    "曝光",
    "观看量",
    "封面点击率",
    "点赞",
    "评论",
    "收藏",
    "涨粉",
    "分享",
    "人均观看时长",
    "弹幕"
  ];

  var headerAliases = {
    "笔记标题": ["笔记标题", "标题", "作品名称"],
    "首次发布时间": ["首次发布时间", "发布时间", "发布日期"],
    "曝光": ["曝光"],
    "观看量": ["观看量", "小眼睛", "阅读量"],
    "封面点击率": ["封面点击率", "点击率"],
    "点赞": ["点赞"],
    "评论": ["评论"],
    "收藏": ["收藏"],
    "涨粉": ["涨粉", "新增关注", "粉丝增长"],
    "分享": ["分享"],
    "人均观看时长": ["人均观看时长"],
    "弹幕": ["弹幕"]
  };

  var rawRows = [];
  var analyzedRows = [];
  var compareRows = [];
  var compareContext = null;

  var csvFile = document.getElementById("csvFile");
  var observationTime = document.getElementById("observationTime");
  var observationTimeSource = document.getElementById("observationTimeSource");
  var analyzeBtn = document.getElementById("analyzeBtn");
  var exportTopicBtn = document.getElementById("exportTopicBtn");
  var reidentifyTopicBtn = document.getElementById("reidentifyTopicBtn");
  var applyCorrectionBtn = document.getElementById("applyCorrectionBtn");
  var exportCorrectionBtn = document.getElementById("exportCorrectionBtn");
  var importCorrectionFile = document.getElementById("importCorrectionFile");
  var cleanPendingCacheBtn = document.getElementById("cleanPendingCacheBtn");
  var cleanEmptyTitleCacheBtn = document.getElementById("cleanEmptyTitleCacheBtn");
  var messageBox = document.getElementById("messageBox");
  var resultBody = document.getElementById("resultBody");
  var allSummaryGrid = document.getElementById("allSummaryGrid");
  var filteredSummaryGrid = document.getElementById("filteredSummaryGrid");
  var statusDistributionGrid = document.getElementById("statusDistributionGrid");
  var reportModeSelect = document.getElementById("reportModeSelect");
  var reportTopModeSelect = document.getElementById("reportTopModeSelect");
  var reportIncludeAnomalies = document.getElementById("reportIncludeAnomalies");
  var reportIntervalText = document.getElementById("reportIntervalText");
  var trendChart = document.getElementById("trendChart");
  var engagementTrendChart = document.getElementById("engagementTrendChart");
  var viewsTopChart = document.getElementById("viewsTopChart");
  var likeCollectTopChart = document.getElementById("likeCollectTopChart");
  var growthDistributionChart = document.getElementById("growthDistributionChart");
  var singleStatusChart = document.getElementById("singleStatusChart");
  var lifecycleFilterSelect = document.getElementById("lifecycleFilterSelect");
  var statusFilterSelect = document.getElementById("statusFilterSelect");
  var sortSelect = document.getElementById("sortSelect");
  var snapshotList = document.getElementById("snapshotList");
  var addSnapshotBtn = document.getElementById("addSnapshotBtn");
  var compareBtn = document.getElementById("compareBtn");
  var compareSummaryGrid = document.getElementById("compareSummaryGrid");
  var compareIntervalSummaryGrid = document.getElementById("compareIntervalSummaryGrid");
  var compareIntervalFilter = document.getElementById("compareIntervalFilter");
  var compareStatusFilter = document.getElementById("compareStatusFilter");
  var compareSortSelect = document.getElementById("compareSortSelect");
  var exportCompareBtn = document.getElementById("exportCompareBtn");
  var compareResultBody = document.getElementById("compareResultBody");
  var generateSingleRecapBtn = document.getElementById("generateSingleRecapBtn");
  var generateCompareRecapBtn = document.getElementById("generateCompareRecapBtn");
  var generateAiRecapBtn = document.getElementById("generateAiRecapBtn");
  var copyRecapBtn = document.getElementById("copyRecapBtn");
  var clearRecapBtn = document.getElementById("clearRecapBtn");
  var recapTextarea = document.getElementById("recapTextarea");
  var aiModelText = document.getElementById("aiModelText");
  var aiBasisText = document.getElementById("aiBasisText");
  var aiWarningBox = document.getElementById("aiWarningBox");
  var aiConfiguredTokensText = document.getElementById("aiConfiguredTokensText");
  var aiActualTokensText = document.getElementById("aiActualTokensText");
  var aiAutoContinueText = document.getElementById("aiAutoContinueText");
  var aiContinueCountText = document.getElementById("aiContinueCountText");
  var aiFinishReasonText = document.getElementById("aiFinishReasonText");
  var aiTruncatedText = document.getElementById("aiTruncatedText");
  var aiPromptTokensText = document.getElementById("aiPromptTokensText");
  var aiCompletionTokensText = document.getElementById("aiCompletionTokensText");
  var aiTotalTokensText = document.getElementById("aiTotalTokensText");
  var visualModeMinimal = document.getElementById("visualModeMinimal");
  var visualModeAdvanced = document.getElementById("visualModeAdvanced");
  var visualModeStandard = document.getElementById("visualModeStandard");
  var snapshotInputSeq = 0;

  applyVisualMode(getSavedVisualMode());

  csvFile.addEventListener("change", handleFileChange);
  observationTime.addEventListener("input", function () {
    updateObservationTimeSource("观察时间已手动修改，请确认格式为 YYYY-MM-DD HH:mm。", "muted");
  });
  analyzeBtn.addEventListener("click", runAnalysis);
  exportTopicBtn.addEventListener("click", exportTopicCsv);
  reidentifyTopicBtn.addEventListener("click", reidentifyTopics);
  applyCorrectionBtn.addEventListener("click", applyTopicCorrectionLibrary);
  exportCorrectionBtn.addEventListener("click", exportTopicCorrectionLibrary);
  importCorrectionFile.addEventListener("change", importTopicCorrectionLibrary);
  cleanPendingCacheBtn.addEventListener("click", cleanPendingTopicCache);
  if (cleanEmptyTitleCacheBtn) {
    cleanEmptyTitleCacheBtn.addEventListener("click", cleanEmptyTitleCorrectionCache);
  }
  resultBody.addEventListener("focusout", handleTopicEdit);
  resultBody.addEventListener("keydown", handleTopicKeydown);
  lifecycleFilterSelect.addEventListener("change", renderTable);
  statusFilterSelect.addEventListener("change", renderTable);
  sortSelect.addEventListener("change", renderTable);
  if (reportModeSelect) {
    reportModeSelect.addEventListener("change", renderReportDashboard);
  }
  if (reportTopModeSelect) {
    reportTopModeSelect.addEventListener("change", renderReportDashboard);
  }
  if (reportIncludeAnomalies) {
    reportIncludeAnomalies.addEventListener("change", renderReportDashboard);
  }
  addSnapshotBtn.addEventListener("click", addSnapshotInput);
  snapshotList.addEventListener("click", handleSnapshotListClick);
  snapshotList.addEventListener("change", handleSnapshotListChange);
  snapshotList.addEventListener("input", handleSnapshotListInput);
  compareBtn.addEventListener("click", runSnapshotCompare);
  compareIntervalFilter.addEventListener("change", handleCompareIntervalFilterChange);
  compareStatusFilter.addEventListener("change", renderCompareTable);
  compareSortSelect.addEventListener("change", renderCompareTable);
  exportCompareBtn.addEventListener("click", exportCompareCsv);
  generateSingleRecapBtn.addEventListener("click", generateSingleCsvRecap);
  generateCompareRecapBtn.addEventListener("click", generateMultiSnapshotRecap);
  generateAiRecapBtn.addEventListener("click", generateAiRecap);
  copyRecapBtn.addEventListener("click", copyRecapText);
  clearRecapBtn.addEventListener("click", clearRecapText);
  if (visualModeMinimal) {
    visualModeMinimal.addEventListener("click", function () {
      setVisualMode("minimal");
    });
  }
  if (visualModeStandard) {
    visualModeStandard.addEventListener("click", function () {
      setVisualMode("standard");
    });
  }
  initTooltips();
  initializeSnapshotInputs();
  applyStaticTooltips();
  renderReportDashboard();
  updateAiStatusBar();
  refreshAiModelStatus();

  function getSavedVisualMode() {
    try {
      var savedMode = localStorage.getItem("xhs-visual-mode");
      if (savedMode === "minimal" || savedMode === "standard") {
        return savedMode;
      }
      return "standard";
    } catch (error) {
      return "standard";
    }
  }

  function setVisualMode(mode) {
    applyVisualMode(mode);
    try {
      localStorage.setItem("xhs-visual-mode", mode);
    } catch (error) {
      return;
    }
  }

  function applyVisualMode(mode) {
    var nextMode = mode === "minimal" ? mode : "standard";
    document.body.classList.toggle("effects-minimal", nextMode === "minimal");
    document.body.classList.toggle("effects-standard", nextMode === "standard");
    document.body.classList.remove("effects-advanced");
    if (visualModeMinimal) {
      visualModeMinimal.classList.toggle("is-active", nextMode === "minimal");
      visualModeMinimal.setAttribute("aria-pressed", nextMode === "minimal" ? "true" : "false");
    }
    if (visualModeAdvanced) {
      visualModeAdvanced.classList.remove("is-active");
      visualModeAdvanced.setAttribute("aria-pressed", "false");
    }
    if (visualModeStandard) {
      visualModeStandard.classList.toggle("is-active", nextMode === "standard");
      visualModeStandard.setAttribute("aria-pressed", nextMode === "standard" ? "true" : "false");
    }
  }

  function handleFileChange(event) {
    var file = event.target.files[0];
    rawRows = [];
    analyzedRows = [];
    clearOverview();
    resetStatusFilterOptions();
    updateAiStatusBar();
    renderReportDashboard();
    renderEmpty("CSV 已选择，请输入当前观察时间后点击“开始分析”。");

    if (!file) {
      updateObservationTimeSource("未选择 CSV 文件。", "muted");
      renderEmpty("请上传 CSV，并输入当前观察时间后开始分析。");
      return;
    }

    applyObservationTimeFromFile(file, observationTime, observationTimeSource);

    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      try {
        rawRows = parseCsvFromBuffer(loadEvent.target.result);
        showMessage(
          "已读取 " + rawRows.rows.length + " 条数据。识别到表头在第 " +
          (rawRows.headerRowIndex + 1) + " 行，分隔符为：" + rawRows.delimiterName + "。",
          true
        );
      } catch (error) {
        rawRows = [];
        showMessage(error.message, false);
        renderEmpty("CSV 读取失败，请检查页面提示中的表头信息。");
      }
    };
    reader.onerror = function () {
      showMessage("读取文件失败，请重新选择 CSV 文件。", false);
    };
    reader.readAsArrayBuffer(file);
  }

  function runAnalysis() {
    if (!rawRows || !rawRows.rows || rawRows.rows.length === 0) {
      showMessage("请先上传一份 CSV 文件。", false);
      return;
    }

    var observeDate = parseLocalDate(observationTime.value);
    if (!observeDate) {
      showMessage("无法自动识别观察时间，请把 CSV 文件名改成类似“0610 19点45.csv”，或手动填写观察时间。", false);
      return;
    }

    try {
      var emptyTitlePublishCounts = buildEmptyTitlePublishCounts(rawRows.rows);
      analyzedRows = rawRows.rows.map(function (row, index) {
        return analyzeRow(row, observeDate, index, emptyTitlePublishCounts);
      });
      updateOverview(analyzedRows);
      updateStatusFilterOptions(analyzedRows);
      renderTable();
      updateAiStatusBar();
      showMessage("分析完成，共处理 " + analyzedRows.length + " 条笔记。", true);
    } catch (error) {
      showMessage(error.message, false);
    }
  }

  function initializeSnapshotInputs() {
    snapshotList.innerHTML = "";
    snapshotInputSeq = 0;
    addSnapshotInput();
    addSnapshotInput();
  }

  function addSnapshotInput() {
    snapshotInputSeq += 1;
    var card = document.createElement("article");
    card.className = "snapshot-card";
    card.setAttribute("data-snapshot-card", "true");
    card.innerHTML = [
      "<div class=\"snapshot-card-header\">",
        "<h3>快照 " + snapshotInputSeq + "</h3>",
        "<button class=\"secondary-btn remove-snapshot-btn\" type=\"button\">删除</button>",
      "</div>",
      "<div class=\"snapshot-fields\">",
        "<div class=\"field-group\">",
          "<label data-tooltip=\"某一个时间点导出的小红书数据。\">快照 CSV</label>",
          "<input class=\"snapshot-file-input\" type=\"file\" accept=\".csv,text/csv\">",
          "<p class=\"hint snapshot-file-name\">选择这个时间点导出的小红书 CSV。</p>",
        "</div>",
        "<div class=\"field-group\">",
          "<label data-tooltip=\"这个快照对应的数据观察时间，例如：2026-05-27 10:00。\">观察时间</label>",
          "<input class=\"snapshot-time-input\" type=\"text\" placeholder=\"例如：2026-05-27 10:00\">",
          "<p class=\"hint snapshot-time-status\">选择 CSV 后会尝试从文件名自动识别。</p>",
        "</div>",
      "</div>"
    ].join("");
    snapshotList.appendChild(card);
    updateSnapshotCards();
  }

  function handleSnapshotListClick(event) {
    var button = event.target.closest(".remove-snapshot-btn");
    if (!button || button.disabled) {
      return;
    }
    var card = button.closest("[data-snapshot-card]");
    if (card) {
      card.remove();
      updateSnapshotCards();
    }
  }

  function handleSnapshotListChange(event) {
    if (!event.target.classList.contains("snapshot-file-input")) {
      return;
    }
    var card = event.target.closest("[data-snapshot-card]");
    var file = event.target.files && event.target.files[0];
    var timeInput = card ? card.querySelector(".snapshot-time-input") : null;
    var statusElement = card ? card.querySelector(".snapshot-time-status") : null;
    var fileNameElement = card ? card.querySelector(".snapshot-file-name") : null;

    if (!file) {
      if (timeInput) {
        timeInput.value = "";
      }
      updateTimeSourceElement(statusElement, "未选择 CSV 文件。", "muted");
      if (fileNameElement) {
        fileNameElement.textContent = "选择这个时间点导出的小红书 CSV。";
      }
      return;
    }

    if (fileNameElement) {
      fileNameElement.textContent = "文件名：" + file.name;
    }
    applyObservationTimeFromFile(file, timeInput, statusElement);
  }

  function handleSnapshotListInput(event) {
    if (!event.target.classList.contains("snapshot-time-input")) {
      return;
    }
    var card = event.target.closest("[data-snapshot-card]");
    var statusElement = card ? card.querySelector(".snapshot-time-status") : null;
    updateTimeSourceElement(statusElement, "观察时间已手动修改，请确认格式为 YYYY-MM-DD HH:mm。", "muted");
  }

  function updateSnapshotCards() {
    var cards = Array.prototype.slice.call(snapshotList.querySelectorAll("[data-snapshot-card]"));
    cards.forEach(function (card, index) {
      var title = card.querySelector("h3");
      var removeButton = card.querySelector(".remove-snapshot-btn");
      if (title) {
        title.textContent = "快照 " + (index + 1);
      }
      if (removeButton) {
        removeButton.disabled = cards.length <= 2;
      }
    });
  }

  function runSnapshotCompare() {
    var snapshots = collectSnapshotInputs();
    if (!snapshots) {
      return;
    }

    Promise.all(snapshots.map(function (snapshot) {
      return readFileAsArrayBuffer(snapshot.file).then(function (buffer) {
        var parsed = parseCsvFromBuffer(buffer);
        return {
          label: snapshot.label,
          fileName: snapshot.file.name,
          timeText: snapshot.timeText,
          date: snapshot.date,
          rows: (function () {
            var emptyTitlePublishCounts = buildEmptyTitlePublishCounts(parsed.rows);
            return parsed.rows.map(function (row, index) {
              return analyzeRow(row, snapshot.date, index, emptyTitlePublishCounts);
            });
          })()
        };
      });
    }))
      .then(function (parsedSnapshots) {
        compareContext = buildCompareContext(parsedSnapshots);
        compareRows = buildMultiCompareRows(parsedSnapshots);
        updateCompareIntervalFilter(compareRows);
        updateCompareStatusFilter(getCompareRowsForSelectedInterval(), "all");
        updateCompareSummary(compareRows, compareContext);
        updateIntervalSummaries(compareRows, compareContext);
        renderCompareTable();
        updateAiStatusBar();
        renderReportDashboard();
        showMessage("多快照对比完成，共生成 " + compareRows.length + " 条区间对比结果。", true);
      })
      .catch(function (error) {
        compareRows = [];
        compareContext = null;
        renderCompareEmpty("多快照对比失败，请检查 CSV 和观察时间。");
        updateCompareIntervalFilter([]);
        updateCompareStatusFilter([], "all");
        updateCompareSummary([], null);
        updateIntervalSummaries([], null);
        updateAiStatusBar();
        renderReportDashboard();
        showMessage(error.message, false);
      });
  }

  function collectSnapshotInputs() {
    var cards = Array.prototype.slice.call(snapshotList.querySelectorAll("[data-snapshot-card]"));
    if (cards.length < 2) {
      showMessage("请至少保留 2 个快照。", false);
      return null;
    }

    var snapshots = [];
    var seenTimes = {};
    for (var i = 0; i < cards.length; i += 1) {
      var fileInput = cards[i].querySelector(".snapshot-file-input");
      var timeInput = cards[i].querySelector(".snapshot-time-input");
      var file = fileInput && fileInput.files ? fileInput.files[0] : null;
      var timeText = timeInput ? timeInput.value.trim() : "";
      var date = parseLocalDate(timeText);
      var label = "快照 " + (i + 1);

      if (!file) {
        showMessage(label + " 还没有选择 CSV 文件。", false);
        return null;
      }
      if (!timeText || !date) {
        showMessage("第 " + (i + 1) + " 个快照无法识别观察时间，请修改文件名或手动填写。", false);
        return null;
      }
      if (seenTimes[date.getTime()]) {
        showMessage("发现重复的观察时间：" + timeText + "。每个快照时间必须不同。", false);
        return null;
      }
      seenTimes[date.getTime()] = true;
      snapshots.push({
        label: label,
        file: file,
        timeText: timeText,
        date: date
      });
    }

    return snapshots.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });
  }

  function buildCompareContext(snapshots) {
    var first = snapshots[0];
    var last = snapshots[snapshots.length - 1];
    return {
      snapshots: snapshots,
      snapshotCount: snapshots.length,
      intervalCount: Math.max(0, snapshots.length - 1),
      startDate: first.date,
      endDate: last.date,
      totalHours: (last.date.getTime() - first.date.getTime()) / 3600000
    };
  }

  function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result);
      };
      reader.onerror = function () {
        reject(new Error("读取文件失败：" + file.name));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function applyObservationTimeFromFile(file, inputElement, statusElement) {
    if (!inputElement || !file) {
      return null;
    }

    var parsed = parseObservationTimeFromFilename(file.name);
    if (parsed) {
      inputElement.value = parsed.text;
      updateTimeSourceElement(statusElement, "观察时间：" + parsed.text + "；来源：文件名自动识别", "ok");
      return parsed.date;
    }

    var fallback = parseObservationTimeFromLastModified(file);
    if (fallback) {
      inputElement.value = fallback.text;
      updateTimeSourceElement(statusElement, "观察时间：" + fallback.text + "；来源：文件修改时间，请确认是否准确", "warning");
      return fallback.date;
    }

    updateTimeSourceElement(statusElement, "未识别到时间，请手动填写。推荐文件名：0610 19点45.csv", "warning");
    return null;
  }

  function parseObservationTimeFromFilename(fileName) {
    var name = String(fileName || "")
      .replace(/\.[^.]+$/, "")
      .trim();
    var match = name.match(/^(\d{2})(\d{2})\s+(\d{1,2})点(\d{1,2})?$/);
    if (!match) {
      return null;
    }

    var year = new Date().getFullYear();
    var month = Number(match[1]);
    var day = Number(match[2]);
    var hour = Number(match[3]);
    var minute = match[4] === undefined ? 0 : Number(match[4]);
    var date = new Date(year, month - 1, day, hour, minute, 0);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }

    return {
      date: date,
      text: formatObservationDate(date),
      source: "filename"
    };
  }

  function parseObservationTimeFromLastModified(file) {
    if (!file || !file.lastModified) {
      return null;
    }
    var date = new Date(file.lastModified);
    if (!Number.isFinite(date.getTime())) {
      return null;
    }
    return {
      date: date,
      text: formatObservationDate(date),
      source: "lastModified"
    };
  }

  function formatObservationDate(date) {
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate())
    ].join("-") + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  function updateObservationTimeSource(message, state) {
    updateTimeSourceElement(observationTimeSource, message, state);
  }

  function updateTimeSourceElement(element, message, state) {
    if (!element) {
      return;
    }
    element.textContent = message;
    element.classList.remove("time-source-ok", "time-source-warning", "time-source-muted");
    element.classList.add("time-source-" + (state || "muted"));
  }

  function buildCompareRows(oldRows, newRows, context) {
    var oldMap = buildSnapshotMap(oldRows);
    var newMap = buildSnapshotMap(newRows);
    var keys = {};
    Object.keys(oldMap).forEach(function (key) {
      keys[key] = true;
    });
    Object.keys(newMap).forEach(function (key) {
      keys[key] = true;
    });

    return Object.keys(keys).map(function (key) {
      var oldRow = oldMap[key] || null;
      var newRow = newMap[key] || null;
      var baseRow = newRow || oldRow;
      var deltas = calculateDeltas(oldRow, newRow);
      var growth = decideGrowthStatus(deltas, oldRow, newRow);
      var intervalHours = context.intervalHours;

      return {
        key: key,
        topic: baseRow.topic,
        title: baseRow.title,
        publishedText: baseRow.publishedText,
        publishedAt: baseRow.publishedAt,
        oldTimeText: context.oldTimeText,
        newTimeText: context.newTimeText,
        intervalHours: intervalHours,
        oldImpressions: oldRow ? oldRow.impressions : 0,
        newImpressions: newRow ? newRow.impressions : 0,
        deltaImpressions: deltas.impressions,
        oldViews: oldRow ? oldRow.views : 0,
        newViews: newRow ? newRow.views : 0,
        deltaViews: deltas.views,
        oldLikes: oldRow ? oldRow.likes : 0,
        newLikes: newRow ? newRow.likes : 0,
        deltaLikes: deltas.likes,
        oldCollects: oldRow ? oldRow.collects : 0,
        newCollects: newRow ? newRow.collects : 0,
        deltaCollects: deltas.collects,
        deltaComments: deltas.comments,
        deltaShares: deltas.shares,
        deltaFollowers: deltas.followers,
        deltaDanmaku: deltas.danmaku,
        deltaLikeCollect: deltas.likeCollect,
        deltaInteractions: deltas.interactions,
        deltaViewsPerHour: safeDivide(deltas.views, intervalHours),
        deltaImpressionsPerHour: safeDivide(deltas.impressions, intervalHours),
        deltaLikeCollectPerHour: safeDivide(deltas.likeCollect, intervalHours),
        deltaInteractionsPerHour: safeDivide(deltas.interactions, intervalHours),
        growthStatus: growth.status,
        growthAdvice: growth.advice,
        compareType: !oldRow ? "new" : (!newRow ? "missing" : "matched"),
        hasNegativeDelta: hasNegativeDelta(deltas)
      };
    });
  }

  function buildMultiCompareRows(snapshots) {
    var rows = [];

    for (var i = 0; i < snapshots.length - 1; i += 1) {
      var previousSnapshot = snapshots[i];
      var nextSnapshot = snapshots[i + 1];
      var intervalHours = (nextSnapshot.date.getTime() - previousSnapshot.date.getTime()) / 3600000;

      if (intervalHours <= 0) {
        throw new Error("快照时间必须按从早到晚排列，且后一个快照必须晚于前一个快照。");
      }

      var previousMap = buildSnapshotMap(previousSnapshot.rows);
      var nextMap = buildSnapshotMap(nextSnapshot.rows);
      var keys = {};
      Object.keys(previousMap).forEach(function (key) {
        keys[key] = true;
      });
      Object.keys(nextMap).forEach(function (key) {
        keys[key] = true;
      });

      Object.keys(keys).forEach(function (key) {
        rows.push(buildIntervalCompareRow({
          key: key,
          intervalIndex: i,
          intervalKey: "interval-" + i,
          intervalLabel: formatDisplayDate(previousSnapshot.date.getTime()) + " -> " + formatDisplayDate(nextSnapshot.date.getTime()),
          intervalStartText: formatDisplayDate(previousSnapshot.date.getTime()),
          intervalEndText: formatDisplayDate(nextSnapshot.date.getTime()),
          intervalHours: intervalHours,
          previousRow: previousMap[key] || null,
          nextRow: nextMap[key] || null
        }));
      });
    }

    return rows;
  }

  function buildIntervalCompareRow(options) {
    var oldRow = options.previousRow;
    var newRow = options.nextRow;
    var baseRow = newRow || oldRow;
    var deltas = calculateDeltas(oldRow, newRow);
    var growth = decideGrowthStatus(deltas, oldRow, newRow);

    return {
      key: options.intervalKey + "::" + options.key,
      snapshotKey: options.key,
      intervalIndex: options.intervalIndex,
      intervalKey: options.intervalKey,
      intervalLabel: options.intervalLabel,
      intervalStartText: options.intervalStartText,
      intervalEndText: options.intervalEndText,
      intervalHours: options.intervalHours,
      topic: baseRow.topic,
      title: baseRow.title,
      publishedText: baseRow.publishedText,
      publishedAt: baseRow.publishedAt,
      oldTimeText: options.intervalStartText,
      newTimeText: options.intervalEndText,
      oldImpressions: oldRow ? oldRow.impressions : 0,
      newImpressions: newRow ? newRow.impressions : 0,
      deltaImpressions: deltas.impressions,
      oldViews: oldRow ? oldRow.views : 0,
      newViews: newRow ? newRow.views : 0,
      deltaViews: deltas.views,
      oldLikes: oldRow ? oldRow.likes : 0,
      newLikes: newRow ? newRow.likes : 0,
      deltaLikes: deltas.likes,
      oldCollects: oldRow ? oldRow.collects : 0,
      newCollects: newRow ? newRow.collects : 0,
      deltaCollects: deltas.collects,
      deltaComments: deltas.comments,
      deltaShares: deltas.shares,
      deltaFollowers: deltas.followers,
      deltaDanmaku: deltas.danmaku,
      deltaLikeCollect: deltas.likeCollect,
      deltaInteractions: deltas.interactions,
      deltaViewsPerHour: safeDivide(deltas.views, options.intervalHours),
      deltaImpressionsPerHour: safeDivide(deltas.impressions, options.intervalHours),
      deltaLikeCollectPerHour: safeDivide(deltas.likeCollect, options.intervalHours),
      deltaInteractionsPerHour: safeDivide(deltas.interactions, options.intervalHours),
      growthStatus: growth.status,
      growthAdvice: growth.advice,
      compareType: !oldRow ? "new" : (!newRow ? "missing" : "matched"),
      hasNegativeDelta: hasNegativeDelta(deltas),
      matchRisk: options.key.indexOf("EMPTY_TITLE__") === 0 || options.key.indexOf("empty-title__") === 0
    };
  }

  function buildSnapshotMap(rows) {
    var map = {};
    var keyCounts = {};
    rows.forEach(function (row) {
      var baseKey = buildSnapshotBaseKey(row);
      keyCounts[baseKey] = (keyCounts[baseKey] || 0) + 1;
    });
    rows.forEach(function (row, index) {
      var key = buildSnapshotKey(row, index, keyCounts);
      if (!map[key]) {
        map[key] = row;
      }
    });
    return map;
  }

  function buildSnapshotBaseKey(row) {
    var normalizedTitle = normalizeCompareTitle(row.title);
    var normalizedTime = formatSnapshotTime(row.publishedAt);
    if (!normalizedTitle) {
      return "EMPTY_TITLE__" + normalizedTime;
    }
    return normalizedTitle + "__" + normalizedTime;
  }

  function buildSnapshotKey(row, index, keyCounts) {
    var baseKey = buildSnapshotBaseKey(row);
    if (baseKey.indexOf("EMPTY_TITLE__") === 0 && keyCounts && keyCounts[baseKey] > 1) {
      return baseKey + "__row-" + index;
    }
    return baseKey;
  }

  function normalizeCompareTitle(title) {
    return String(title || "").trim().replace(/\s+/g, " ");
  }

  function formatSnapshotTime(timestamp) {
    var date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) {
      return "";
    }
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate())
    ].join("-") + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds());
  }

  function calculateDeltas(oldRow, newRow) {
    var oldValues = getCompareValues(oldRow);
    var newValues = getCompareValues(newRow);
    var likes = newValues.likes - oldValues.likes;
    var collects = newValues.collects - oldValues.collects;
    var comments = newValues.comments - oldValues.comments;
    var shares = newValues.shares - oldValues.shares;

    return {
      impressions: newValues.impressions - oldValues.impressions,
      views: newValues.views - oldValues.views,
      likes: likes,
      collects: collects,
      comments: comments,
      shares: shares,
      followers: newValues.followers - oldValues.followers,
      danmaku: newValues.danmaku - oldValues.danmaku,
      likeCollect: likes + collects,
      interactions: likes + collects + comments + shares
    };
  }

  function getCompareValues(row) {
    return {
      impressions: row ? row.impressions : 0,
      views: row ? row.views : 0,
      likes: row ? row.likes : 0,
      collects: row ? row.collects : 0,
      comments: row ? row.comments : 0,
      shares: row ? row.shares : 0,
      followers: row ? row.followers : 0,
      danmaku: row ? row.danmaku : 0
    };
  }

  function hasNegativeDelta(deltas) {
    return Object.keys(deltas).some(function (key) {
      return deltas[key] < 0;
    });
  }

  function decideGrowthStatus(deltas, oldRow, newRow) {
    if (newRow && !oldRow) {
      return {
        status: "新增笔记",
        advice: "这是后一个快照中出现的新笔记，无法计算完整增长。"
      };
    }
    if (oldRow && !newRow) {
      return {
        status: "快照缺失",
        advice: "后一个快照中没有找到这篇笔记，请检查两份 CSV 是否来自同一账号或导出范围是否一致。"
      };
    }
    if (deltas.views >= 500 && deltas.likeCollect >= 50) {
      return {
        status: "明显放量",
        advice: "这段时间增长强，建议重点观察，不要频繁干扰。"
      };
    }
    if (deltas.views >= 100 && deltas.likeCollect >= 10) {
      return {
        status: "稳定增长",
        advice: "仍有流量进入，可以继续观察。"
      };
    }
    if (deltas.views >= 20 && deltas.likeCollect >= 2) {
      return {
        status: "小幅增长",
        advice: "有少量新增，继续观察即可。"
      };
    }
    if (deltas.views < 50 && deltas.likeCollect < 5 && newRow.views >= 1000) {
      return {
        status: "疑似尾流",
        advice: "当前时间段增长偏弱，可能进入低速阶段，需要结合连续多个区间判断。"
      };
    }
    if (deltas.views < 20 && deltas.likeCollect < 2) {
      return {
        status: "基本停滞",
        advice: "这段时间几乎没有新增，不优先复用。"
      };
    }
    return {
      status: "小幅增长",
      advice: "有少量新增，继续观察即可。"
    };
  }

  function parseCsvFromBuffer(buffer) {
    var encodings = ["utf-8", "gb18030", "gbk"];
    var errors = [];

    for (var i = 0; i < encodings.length; i += 1) {
      try {
        var text = decodeBuffer(buffer, encodings[i]);
        var parsed = parseCsv(text);
        parsed.encoding = encodings[i];
        return parsed;
      } catch (error) {
        errors.push(error.message);
      }
    }

    throw new Error(errors[errors.length - 1] || "CSV 读取失败，请检查文件格式。");
  }

  function decodeBuffer(buffer, encoding) {
    if (typeof TextDecoder === "undefined") {
      var bytes = new Uint8Array(buffer);
      var text = "";
      for (var i = 0; i < bytes.length; i += 1) {
        text += String.fromCharCode(bytes[i]);
      }
      return text;
    }

    try {
      return new TextDecoder(encoding).decode(buffer);
    } catch (error) {
      if (encoding === "gbk") {
        return new TextDecoder("gb18030").decode(buffer);
      }
      throw error;
    }
  }

  function parseCsv(text) {
    var cleanText = String(text || "").replace(/^\uFEFF/, "");
    var delimiterInfo = detectDelimiter(cleanText);
    var lines = splitCsv(cleanText, delimiterInfo.value);
    lines = lines.filter(function (line) {
      return line.some(function (value) {
        return normalizeHeader(value) !== "";
      });
    });

    if (lines.length < 2) {
      throw new Error("CSV 至少需要包含表头和 1 条数据。");
    }

    var headerInfo = findHeaderLine(lines);
    if (!headerInfo) {
      throw buildHeaderError(null, lines.slice(0, 10), []);
    }

    var headers = headerInfo.headers;
    var mapping = buildHeaderMapping(headers);
    var missing = getMissingHeaders(mapping);
    if (missing.length > 0) {
      throw buildHeaderError(headerInfo, lines.slice(0, 10), missing);
    }

    var rows = lines.slice(headerInfo.index + 1).map(function (line) {
      var item = {};
      requiredHeaders.forEach(function (canonicalHeader) {
        var sourceIndex = mapping[canonicalHeader];
        item[canonicalHeader] = typeof line[sourceIndex] === "undefined" ? "" : cleanCell(line[sourceIndex]);
      });
      var topicIndex = findOptionalHeaderIndex(headers, ["选题/菜品名", "选题", "菜品名"]);
      if (topicIndex !== -1) {
        item["选题/菜品名"] = typeof line[topicIndex] === "undefined" ? "" : cleanCell(line[topicIndex]);
      }
      return item;
    }).filter(function (row) {
      return requiredHeaders.some(function (header) {
        return row[header] !== "";
      });
    });

    if (rows.length === 0) {
      throw new Error("已找到表头，但表头下方没有识别到有效数据行。");
    }

    return {
      headers: headers,
      rows: rows,
      headerRowIndex: headerInfo.index,
      delimiterName: delimiterInfo.name
    };
  }

  function detectDelimiter(text) {
    var candidates = [
      { value: ",", name: "英文逗号 ," },
      { value: "\t", name: "制表符 Tab" },
      { value: ";", name: "分号 ;" }
    ];
    var best = candidates[0];
    var bestScore = -1;

    candidates.forEach(function (candidate) {
      var lines = splitCsv(text, candidate.value).slice(0, 10);
      var score = 0;

      lines.forEach(function (line) {
        var normalized = line.map(normalizeHeader);
        if (normalized.indexOf("笔记标题") !== -1 || normalized.indexOf("标题") !== -1 || normalized.indexOf("作品名称") !== -1) {
          score += 3;
        }
        if (normalized.indexOf("首次发布时间") !== -1 || normalized.indexOf("发布时间") !== -1 || normalized.indexOf("发布日期") !== -1) {
          score += 3;
        }
        if (normalized.indexOf("观看量") !== -1 || normalized.indexOf("小眼睛") !== -1 || normalized.indexOf("阅读量") !== -1) {
          score += 3;
        }
        score += Math.min(normalized.length, 20) / 100;
      });

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });

    return best;
  }

  function splitCsv(text, delimiter) {
    var lines = [];
    var row = [];
    var cell = "";
    var inQuotes = false;

    for (var i = 0; i < text.length; i += 1) {
      var char = text[i];
      var nextChar = text[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i += 1;
        }
        row.push(cell);
        lines.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    lines.push(row);
    return lines;
  }

  function findHeaderLine(lines) {
    var max = Math.min(lines.length, 10);

    for (var i = 0; i < max; i += 1) {
      var headers = lines[i].map(normalizeHeader);
      var hasTitle = hasAny(headers, headerAliases["笔记标题"]);
      var hasPublishedAt = hasAny(headers, headerAliases["首次发布时间"]);
      var hasViews = hasAny(headers, headerAliases["观看量"]);

      if (hasTitle && hasPublishedAt && hasViews) {
        return {
          index: i,
          raw: lines[i],
          headers: headers
        };
      }
    }

    return null;
  }

  function buildHeaderMapping(headers) {
    var mapping = {};

    requiredHeaders.forEach(function (canonicalHeader) {
      var aliases = headerAliases[canonicalHeader] || [canonicalHeader];
      for (var i = 0; i < headers.length; i += 1) {
        if (aliases.indexOf(headers[i]) !== -1) {
          mapping[canonicalHeader] = i;
          return;
        }
      }
    });

    return mapping;
  }

  function getMissingHeaders(mapping) {
    return requiredHeaders.filter(function (header) {
      return typeof mapping[header] === "undefined";
    });
  }

  function findOptionalHeaderIndex(headers, aliases) {
    for (var i = 0; i < headers.length; i += 1) {
      if (aliases.indexOf(headers[i]) !== -1) {
        return i;
      }
    }
    return -1;
  }

  function hasAny(headers, aliases) {
    return aliases.some(function (alias) {
      return headers.indexOf(alias) !== -1;
    });
  }

  function buildHeaderError(headerInfo, previewLines, missing) {
    var recognizedLine = headerInfo ? headerInfo.raw.map(cleanCell).join(" | ") : "前 10 行没有找到同时包含“笔记标题 / 首次发布时间 / 观看量”的表头行";
    var fields = headerInfo ? headerInfo.headers.join("、") : previewLines.map(function (line, index) {
      return "第 " + (index + 1) + " 行：" + line.map(cleanCell).join(" | ");
    }).join("\n");
    var missingText = missing.length ? missing.join("、") : requiredHeaders.join("、");

    return new Error(
      "CSV 表头识别失败。\n" +
      "实际识别到的表头行内容：\n" + recognizedLine + "\n" +
      "实际识别到的字段名列表：\n" + fields + "\n" +
      "缺少这些字段：\n" + missingText
    );
  }

  function cleanCell(value) {
    return String(value === null || typeof value === "undefined" ? "" : value)
      .replace(/^\uFEFF/, "")
      .replace(/[\r\n]/g, "")
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .trim();
  }

  function normalizeHeader(value) {
    return cleanCell(value).replace(/\s+/g, "");
  }

  function analyzeRow(row, observeDate, index, emptyTitlePublishCounts) {
    var publishedDate = parseLocalDate(row["首次发布时间"]);
    if (!publishedDate) {
      throw new Error("第 " + (index + 1) + " 条数据的首次发布时间无法识别：" + row["首次发布时间"]);
    }

    var firstPublishTime = formatSnapshotTime(publishedDate.getTime());
    var ageHours = Math.max(0, (observeDate.getTime() - publishedDate.getTime()) / 3600000);
    var views = parseNumber(row["观看量"]);
    var likes = parseNumber(row["点赞"]);
    var collects = parseNumber(row["收藏"]);
    var comments = parseNumber(row["评论"]);
    var shares = parseNumber(row["分享"]);
    var followers = parseNumber(row["涨粉"]);
    var danmaku = parseNumber(row["弹幕"]);
    var likeCollect = likes + collects;
    var interactions = likes + collects + comments + shares;
    var likeCollectRate = safeDivide(likeCollect, views);
    var collectRate = safeDivide(collects, views);
    var commentRate = safeDivide(comments, views);
    var shareRate = safeDivide(shares, views);
    var followerRate = safeDivide(followers, views);
    var viewsPerHour = ageHours > 0 ? views / ageHours : 0;
    var likeCollectPerHour = ageHours > 0 ? likeCollect / ageHours : 0;
    var statusResult = decideStatus({
      ageHours: ageHours,
      views: views,
      likeCollect: likeCollect,
      likeCollectRate: likeCollectRate,
      viewsPerHour: viewsPerHour,
      likeCollectPerHour: likeCollectPerHour
    });
    var importedTopic = String(row["选题/菜品名"] || "").trim();
    var rawTitle = row["笔记标题"];
    var isEmptyTitle = !normalizeOriginalTitle(rawTitle);
    var noteKey = buildNoteKey(rawTitle, publishedDate.getTime(), index, views, likes, collects, emptyTitlePublishCounts);
    var extractedTopic = extractTopicFromTitle(rawTitle);
    var topicKey = buildTopicStorageKey(row["首次发布时间"], rawTitle, index, views, likes, collects, publishedDate.getTime(), emptyTitlePublishCounts);
    var correction = getTopicCorrection(rawTitle, noteKey, firstPublishTime);
    var legacySavedTopic = getSavedManualTopic(topicKey, extractedTopic);
    var topic = extractedTopic.topic;
    var topicConfidence = extractedTopic.confidence;
    var topicSource = "auto";

    if (correction) {
      topic = correction.topic;
      topicConfidence = "历史修正";
      topicSource = "correction";
    } else if (importedTopic) {
      topic = importedTopic;
      topicConfidence = "已导入";
      topicSource = "imported";
    } else if (legacySavedTopic) {
      topic = legacySavedTopic.topic;
      topicConfidence = "历史修正";
      topicSource = "correction";
      saveTopicCorrection(rawTitle, legacySavedTopic.topic, noteKey, firstPublishTime);
    }

    return {
      topic: topic,
      topicConfidence: topicConfidence,
      topicSource: topicSource,
      topicKey: topicKey,
      noteKey: noteKey,
      isEmptyTitle: isEmptyTitle,
      firstPublishTime: firstPublishTime,
      originalTitle: rawTitle,
      title: rawTitle,
      publishedText: row["首次发布时间"],
      publishedAt: publishedDate.getTime(),
      ageHours: ageHours,
      impressions: parseNumber(row["曝光"]),
      views: views,
      coverCtr: parsePercent(row["封面点击率"]),
      likes: likes,
      comments: comments,
      collects: collects,
      followers: followers,
      shares: shares,
      avgWatchTime: row["人均观看时长"],
      danmaku: danmaku,
      likeCollect: likeCollect,
      interactions: interactions,
      likeCollectRate: likeCollectRate,
      collectRate: collectRate,
      commentRate: commentRate,
      shareRate: shareRate,
      followerRate: followerRate,
      viewsPerHour: viewsPerHour,
      likeCollectPerHour: likeCollectPerHour,
      status: statusResult.status,
      advice: statusResult.advice
    };
  }

  function decideStatus(data) {
    if (data.ageHours <= 2) {
      if (data.views >= 120 && data.likeCollectRate >= 0.08) {
        return result("爆款潜力", "数据起势不错，继续观察，不要频繁改动或隐藏。");
      }
      if (data.views >= 100) {
        return result("初始流量较好", "已经拿到不错的初始观看，继续观察后续赞藏和收藏表现。");
      }
      if (data.views >= 70 && data.views < 100) {
        return result("初始曝光正常", "属于正常启动，不要急着判断失败，继续观察到 4-6 小时。");
      }
      if (data.views >= 30 && data.views < 70) {
        return result("初始流量偏弱", "先不要隐藏，继续观察；如果 4-6 小时仍无增长，再判断是否失败。");
      }
      return result("初始曝光不足", "不要立刻隐藏，先观察是否有延迟推荐；如果 2-6 小时仍低，才考虑失败。");
    }

    if (data.ageHours <= 6) {
      if (data.views >= 300 && data.likeCollectRate >= 0.08) {
        return result("放量中", "有继续放大的可能，建议保护，不要频繁发布干扰。");
      }
      if (data.views >= 150 && data.likeCollectRate >= 0.06) {
        return result("优质观察", "内容质量不错，可以继续观察，有二发或复用价值。");
      }
      if (data.views >= 100 && data.likeCollectRate < 0.04) {
        return result("点击有了但互动弱", "封面或选题可能有吸引力，但内容收藏价值不足，暂不优先复用。");
      }
      if (data.views < 50 && data.likeCollect < 3) {
        return result("冷启动失败", "暂不复用；如果账号当前有爆款在跑，不要急着用新作品干扰。");
      }
      if (data.views < 100 && data.likeCollect < 8) {
        return result("冷启动偏弱", "继续观察，但不要优先加推同类选题。");
      }
      return result("普通观察", "继续观察到 6-24 小时。");
    }

    if (data.ageHours <= 24) {
      if (data.views >= 800 && data.likeCollectRate >= 0.08) {
        return result("爆款", "值得重点复盘和复用，可记录封面、标题、菜品类型和发布时间。");
      }
      if (data.views >= 500 && data.likeCollectRate >= 0.06) {
        return result("优质", "内容质量不错，可以考虑换模板二发或同类选题扩展。");
      }
      if (data.views < 300 && data.likeCollectRate >= 0.08) {
        return result("优质低流量", "内容本身可能不错，但系统分发不足，可以考虑换封面、换标题、换发布时间二发。");
      }
      if (data.views < 100 && data.likeCollect < 5) {
        return result("失败", "暂不复用，不建议围绕这条继续扩展。");
      }
      if (data.views < 200 && data.likeCollect < 10) {
        return result("低流量普通", "暂不优先复用，继续观察是否有延迟推荐。");
      }
      return result("普通", "继续观察。");
    }

    if (data.views >= 3000 && data.likeCollectRate >= 0.08) {
      return result("爆款", "重点复盘，适合做二发、同类选题扩展或系列化。");
    }
    if (data.views >= 1000 && data.viewsPerHour < 30 && data.likeCollectPerHour < 2) {
      return result("疑似尾流", "这条以前表现不错，但现在可能进入低速阶段，建议减少干扰，观察是否还有二次推荐。");
    }
    if (data.views >= 1000 && data.likeCollectRate >= 0.08) {
      return result("优质长尾", "值得复用，可考虑同类菜品、同类封面风格、同类标题结构。");
    }
    if (data.views < 300 && data.likeCollect < 10) {
      return result("失败", "不建议复用，除非后续换封面、换标题、换菜品角度重新做。");
    }
    if (data.views < 500 && data.likeCollectRate < 0.04) {
      return result("普通偏弱", "暂不复用。");
    }
    return result("普通", "作为普通作品观察，不优先复用。");
  }

  function result(status, advice) {
    return {
      status: status,
      advice: advice
    };
  }

  function renderTable() {
    var rows = getVisibleRows();
    updateAccountSummaries(analyzedRows, rows);
    renderReportDashboard();

    if (rows.length === 0) {
      if (analyzedRows.length) {
        resultBody.innerHTML = "<tr><td colspan=\"25\" class=\"empty-cell\">当前筛选条件下没有匹配的笔记。</td></tr>" + renderSummaryRow(buildAccountSummary(rows));
      } else {
        renderEmpty("请上传 CSV，并输入当前观察时间后开始分析。");
      }
      return;
    }

    resultBody.innerHTML = rows.map(function (row) {
      var topicTooltip = getTopicConfidenceTooltip(row.topicConfidence);
      if (row.isEmptyTitle) {
        topicTooltip += (topicTooltip ? " " : "") + "该作品原始标题为空，系统使用首次发布时间作为稳定匹配依据。建议手动确认选题。";
      }
      return [
        "<tr>",
        "<td class=\"topic-cell " + topicCellClass(row.topicConfidence) + "\">" +
          "<div class=\"topic-edit\" contenteditable=\"true\" data-topic-key=\"" + escapeHtml(row.topicKey) + "\" title=\"点击后可直接修改\">" + escapeHtml(row.topic) + "</div>" +
          "<span class=\"topic-tag\" data-tooltip=\"" + escapeHtml(topicTooltip) + "\">" + escapeHtml(row.topicConfidence) + "</span>" +
        "</td>",
        "<td class=\"title-cell\" title=\"" + escapeHtml(row.title) + "\">" + escapeHtml(row.title) + "</td>",
        "<td class=\"published-cell\" title=\"" + escapeHtml(row.publishedText) + "\">" + escapeHtml(formatDisplayDate(row.publishedAt)) + "</td>",
        "<td title=\"" + escapeHtml(formatNumber(row.ageHours, 1) + "小时") + "\">" + escapeHtml(formatDuration(row.ageHours)) + "</td>",
        "<td>" + formatInteger(row.impressions) + "</td>",
        "<td>" + formatInteger(row.views) + "</td>",
        "<td>" + formatPercent(row.coverCtr) + "</td>",
        "<td>" + formatInteger(row.likes) + "</td>",
        "<td>" + formatInteger(row.comments) + "</td>",
        "<td>" + formatInteger(row.collects) + "</td>",
        "<td>" + formatInteger(row.followers) + "</td>",
        "<td>" + formatInteger(row.shares) + "</td>",
        "<td>" + escapeHtml(row.avgWatchTime) + "</td>",
        "<td>" + formatInteger(row.danmaku) + "</td>",
        "<td>" + formatInteger(row.likeCollect) + "</td>",
        "<td>" + formatInteger(row.interactions) + "</td>",
        "<td>" + formatPercent(row.likeCollectRate) + "</td>",
        "<td>" + formatPercent(row.collectRate) + "</td>",
        "<td>" + formatPercent(row.commentRate) + "</td>",
        "<td>" + formatPercent(row.shareRate) + "</td>",
        "<td>" + formatPercent(row.followerRate) + "</td>",
        "<td>" + formatNumber(row.viewsPerHour, 1) + "</td>",
        "<td>" + formatNumber(row.likeCollectPerHour, 1) + "</td>",
        "<td><span class=\"status-badge " + statusClass(row.status) + "\" data-tooltip=\"" + escapeHtml(getStatusTooltip(row.status)) + "\">" + escapeHtml(row.status) + "</span></td>",
        "<td class=\"advice-cell\">" + escapeHtml(row.advice) + "</td>",
        "</tr>"
      ].join("");
    }).join("") + renderSummaryRow(buildAccountSummary(rows));
  }

  function renderCompareTable() {
    var rows = getVisibleCompareRows();
    renderReportDashboard();
    if (!rows.length) {
      renderCompareEmpty(compareRows.length ? "当前筛选条件下没有匹配的对比结果。" : "请至少上传 2 个快照 CSV，并填写每个快照的观察时间后开始对比。");
      return;
    }

    compareResultBody.innerHTML = rows.map(function (row) {
      return [
        "<tr class=\"" + (row.hasNegativeDelta ? "negative-delta-row" : "") + "\">",
        "<td title=\"" + escapeHtml("间隔 " + formatNumber(row.intervalHours, 1) + " 小时") + "\">" + escapeHtml(row.intervalLabel) + "</td>",
        "<td class=\"title-cell\">" + escapeHtml(row.topic) + "</td>",
        "<td class=\"title-cell\" title=\"" + escapeHtml(row.title) + "\">" + escapeHtml(row.title) +
          (row.matchRisk ? "<span class=\"topic-tag\" data-tooltip=\"标题为空，当前使用首次发布时间作为稳定匹配依据；如果同一时间存在多条空标题作品，会追加行号兜底。\">匹配风险</span>" : "") +
        "</td>",
        "<td>" + escapeHtml(formatDisplayDate(row.publishedAt)) + "</td>",
        "<td>" + formatInteger(row.oldViews) + "</td>",
        "<td>" + formatInteger(row.newViews) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaViews) + "</td>",
        "<td>" + formatInteger(row.oldImpressions) + "</td>",
        "<td>" + formatInteger(row.newImpressions) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaImpressions) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaLikes) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaCollects) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaComments) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaShares) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaFollowers) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaLikeCollect) + "</td>",
        "<td title=\"" + escapeHtml(getDeltaTooltip(row)) + "\">" + formatSignedInteger(row.deltaInteractions) + "</td>",
        "<td>" + formatNumber(row.deltaViewsPerHour, 1) + "</td>",
        "<td>" + formatNumber(row.deltaLikeCollectPerHour, 1) + "</td>",
        "<td><span class=\"status-badge " + compareStatusClass(row.growthStatus) + "\" data-tooltip=\"" + escapeHtml(getCompareStatusTooltip(row.growthStatus)) + "\">" + escapeHtml(row.growthStatus) + "</span></td>",
        "<td class=\"advice-cell\">" + escapeHtml(row.growthAdvice) + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderCompareEmpty(message) {
    compareResultBody.innerHTML = "<tr><td colspan=\"21\" class=\"empty-cell\">" + escapeHtml(message) + "</td></tr>";
  }

  function handleCompareIntervalFilterChange() {
    updateCompareStatusFilter(getCompareRowsForSelectedInterval(), compareStatusFilter.value);
    renderCompareTable();
  }

  function getCompareRowsForSelectedInterval() {
    var rows = compareRows.slice();
    var intervalFilterValue = compareIntervalFilter.value;

    if (intervalFilterValue !== "all") {
      rows = rows.filter(function (row) {
        return row.intervalKey === intervalFilterValue;
      });
    }

    return rows;
  }

  function getVisibleCompareRows() {
    var rows = getCompareRowsForSelectedInterval();
    var statusFilterValue = compareStatusFilter.value;
    var sortValue = compareSortSelect.value;

    if (statusFilterValue !== "all") {
      rows = rows.filter(function (row) {
        return row.growthStatus === statusFilterValue;
      });
    }

    rows.sort(function (a, b) {
      var parts = sortValue.split("-");
      var direction = parts.pop();
      var key = parts.join("-");
      var av = Number(a[key]) || 0;
      var bv = Number(b[key]) || 0;
      if (av < bv) {
        return direction === "asc" ? -1 : 1;
      }
      if (av > bv) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return rows;
  }

  function updateCompareIntervalFilter(rows) {
    var counts = {};
    var labels = {};
    rows.forEach(function (row) {
      counts[row.intervalKey] = (counts[row.intervalKey] || 0) + 1;
      labels[row.intervalKey] = row.intervalLabel;
    });
    var keys = Object.keys(counts).sort(function (a, b) {
      return Number(a.replace("interval-", "")) - Number(b.replace("interval-", ""));
    });
    compareIntervalFilter.innerHTML = ["<option value=\"all\">全部区间（" + rows.length + "）</option>"].concat(keys.map(function (key) {
      return "<option value=\"" + escapeHtml(key) + "\">" + escapeHtml(labels[key]) + "（" + counts[key] + "）</option>";
    })).join("");
    compareIntervalFilter.value = "all";
  }

  function updateCompareStatusFilter(rows, preferredValue) {
    var counts = rows.reduce(function (result, row) {
      result[row.growthStatus] = (result[row.growthStatus] || 0) + 1;
      return result;
    }, {});
    var statuses = Object.keys(counts).sort(compareGrowthStatusOrder);
    compareStatusFilter.innerHTML = ["<option value=\"all\">全部（" + rows.length + "）</option>"].concat(statuses.map(function (status) {
      return "<option value=\"" + escapeHtml(status) + "\">" + escapeHtml(status) + "（" + counts[status] + "）</option>";
    })).join("");
    if (preferredValue && preferredValue !== "all" && counts[preferredValue]) {
      compareStatusFilter.value = preferredValue;
    } else {
      compareStatusFilter.value = "all";
    }
  }

  function compareGrowthStatusOrder(a, b) {
    var order = ["明显放量", "稳定增长", "小幅增长", "疑似尾流", "基本停滞", "新增笔记", "快照缺失"];
    var ai = order.indexOf(a);
    var bi = order.indexOf(b);
    if (ai === -1) {
      ai = order.length;
    }
    if (bi === -1) {
      bi = order.length;
    }
    return ai - bi;
  }

  function getVisibleRows() {
    var rows = analyzedRows.slice();
    var lifecycleFilterValue = lifecycleFilterSelect.value;
    var statusFilterValue = statusFilterSelect.value;
    var sortValue = sortSelect.value;

    rows = rows.filter(function (row) {
      return matchesLifecycleFilter(row, lifecycleFilterValue) && matchesStatusFilter(row, statusFilterValue);
    });

    rows.sort(function (a, b) {
      var parts = sortValue.split("-");
      var direction = parts.pop();
      var key = parts.join("-");
      var av = a[key];
      var bv = b[key];

      if (typeof av === "string") {
        av = av.toLowerCase();
      }
      if (typeof bv === "string") {
        bv = bv.toLowerCase();
      }
      if (av < bv) {
        return direction === "asc" ? -1 : 1;
      }
      if (av > bv) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return rows;
  }

  function matchesLifecycleFilter(row, filterValue) {
    if (filterValue === "all") {
      return true;
    }
    if (filterValue === "age-0-2") {
      return row.ageHours <= 2;
    }
    if (filterValue === "age-2-6") {
      return row.ageHours > 2 && row.ageHours <= 6;
    }
    if (filterValue === "age-6-24") {
      return row.ageHours > 6 && row.ageHours <= 24;
    }
    if (filterValue === "age-24-plus") {
      return row.ageHours > 24;
    }
    return true;
  }

  function matchesStatusFilter(row, filterValue) {
    if (filterValue === "all") {
      return true;
    }
    return row.status === filterValue;
  }

  function updateStatusFilterOptions(rows) {
    var previousValue = statusFilterSelect.value || "all";
    var distribution = getStatusDistribution(rows);
    var statuses = distribution.statuses;
    var counts = distribution.counts;
    var options = ["<option value=\"all\">全部状态（" + rows.length + "）</option>"].concat(statuses.map(function (status) {
      return "<option value=\"" + escapeHtml(status) + "\">" + escapeHtml(status) + "（" + counts[status] + "）</option>";
    }));

    statusFilterSelect.innerHTML = options.join("");
    statusFilterSelect.value = counts[previousValue] ? previousValue : "all";
  }

  function getStatusDistribution(rows) {
    var counts = rows.reduce(function (result, row) {
      result[row.status] = (result[row.status] || 0) + 1;
      return result;
    }, {});
    return {
      counts: counts,
      statuses: Object.keys(counts).sort(compareStatusOrder)
    };
  }

  function resetStatusFilterOptions() {
    if (lifecycleFilterSelect) {
      lifecycleFilterSelect.value = "all";
    }
    if (statusFilterSelect) {
      statusFilterSelect.innerHTML = "<option value=\"all\">全部状态（0）</option>";
      statusFilterSelect.value = "all";
    }
  }

  function compareStatusOrder(a, b) {
    var order = [
      "爆款",
      "爆款潜力",
      "放量中",
      "优质",
      "优质观察",
      "优质长尾",
      "优质低流量",
      "初始流量较好",
      "初始曝光正常",
      "初始流量偏弱",
      "初始曝光不足",
      "点击有了但互动弱",
      "普通",
      "普通观察",
      "普通偏弱",
      "低流量普通",
      "冷启动偏弱",
      "冷启动失败",
      "失败",
      "疑似尾流"
    ];
    var ai = order.indexOf(a);
    var bi = order.indexOf(b);
    if (ai === -1) {
      ai = order.length;
    }
    if (bi === -1) {
      bi = order.length;
    }
    if (ai !== bi) {
      return ai - bi;
    }
    return a.localeCompare(b, "zh-CN");
  }

  function handleTopicKeydown(event) {
    if (!event.target.classList.contains("topic-edit")) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
    }
  }

  function handleTopicEdit(event) {
    if (!event.target.classList.contains("topic-edit")) {
      return;
    }

    var key = event.target.getAttribute("data-topic-key");
    var nextTopic = event.target.textContent.trim() || "待填写";
    var row = analyzedRows.find(function (item) {
      return item.topicKey === key;
    });

    if (!row) {
      return;
    }

    row.topic = nextTopic;
    row.topicConfidence = nextTopic === "待填写" ? "需手填" : "手动";
    row.topicSource = nextTopic === "待填写" ? "auto" : "manual";
    if (nextTopic === "待填写") {
      removeSavedTopic(key);
    } else {
      saveTopicCorrection(row.originalTitle, nextTopic, row.noteKey, row.firstPublishTime);
      analyzedRows.forEach(function (item) {
        if (shouldApplyTopicEditToRow(row, item)) {
          item.topic = nextTopic;
          item.topicConfidence = "手动";
          item.topicSource = "manual";
        }
      });
    }
    renderTable();
  }

  function shouldApplyTopicEditToRow(sourceRow, targetRow) {
    if (!sourceRow || !targetRow) {
      return false;
    }
    if (normalizeOriginalTitle(sourceRow.originalTitle)) {
      return sourceRow.originalTitle === targetRow.originalTitle;
    }
    return sourceRow.noteKey && sourceRow.noteKey === targetRow.noteKey;
  }

  function reidentifyTopics() {
    if (!analyzedRows.length) {
      showMessage("请先上传并分析 CSV，再重新识别选题。", false);
      return;
    }

    var updatedCount = 0;
    analyzedRows.forEach(function (row) {
      if (row.topicSource === "manual" || row.topicSource === "correction" || row.topicSource === "imported") {
        return;
      }
      var next = extractTopicFromTitle(row.title);
      if (row.topic !== next.topic || row.topicConfidence !== next.confidence) {
        updatedCount += 1;
      }
      row.topic = next.topic;
      row.topicConfidence = next.confidence;
      row.topicSource = "auto";
    });
    renderTable();
    showMessage("已重新识别选题，更新 " + updatedCount + " 条；手动填写的选题已保留。", true);
  }

  function applyTopicCorrectionLibrary() {
    if (!analyzedRows.length) {
      showMessage("请先上传并分析 CSV，再重新应用修正库。", false);
      return;
    }

    var appliedCount = 0;
    analyzedRows.forEach(function (row) {
      if (row.topicSource === "manual") {
        return;
      }
      var correction = getTopicCorrection(row.originalTitle, row.noteKey, row.firstPublishTime);
      if (!correction) {
        return;
      }
      if (row.topic !== correction.topic || row.topicConfidence !== "历史修正") {
        appliedCount += 1;
      }
      row.topic = correction.topic;
      row.topicConfidence = "历史修正";
      row.topicSource = "correction";
    });
    renderTable();
    showMessage("已重新应用选题修正库，更新 " + appliedCount + " 条。", true);
  }

  function exportTopicCorrectionLibrary() {
    var corrections = getAllTopicCorrections();
    if (!corrections.length) {
      showMessage("当前没有可导出的手动选题修正。", false);
      return;
    }

    var headers = ["原始笔记标题", "选题/菜品名", "来源", "更新时间"];
    var rows = corrections.map(function (item) {
      return [item.originalTitle, item.topic, item.source, item.updatedAt];
    });
    var csv = "\uFEFF" + [headers].concat(rows).map(function (line) {
      return line.map(csvCell).join(",");
    }).join("\r\n");
    downloadCsv(csv, "xhs-topic-correction-library-" + formatFileDate(new Date()) + ".csv");
    showMessage("已导出 " + corrections.length + " 条选题修正。", true);
  }

  function importTopicCorrectionLibrary(event) {
    var file = event.target.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      try {
        var text = decodeBuffer(loadEvent.target.result, "utf-8");
        var imported = parseTopicCorrectionCsv(text);
        imported.forEach(function (item) {
          saveTopicCorrection(item.originalTitle, item.topic);
        });
        if (analyzedRows.length) {
          applyTopicCorrectionLibrary();
          showMessage("成功导入 " + imported.length + " 条选题修正。当前页面数据已自动重新应用修正库。", true);
        } else {
          showMessage("成功导入 " + imported.length + " 条选题修正。上传小红书 CSV 后会自动匹配历史修正。", true);
        }
      } catch (error) {
        showMessage("导入选题修正库失败：" + error.message, false);
      } finally {
        importCorrectionFile.value = "";
      }
    };
    reader.onerror = function () {
      showMessage("读取选题修正库文件失败，请重新选择 CSV。", false);
      importCorrectionFile.value = "";
    };
    reader.readAsArrayBuffer(file);
  }

  function cleanPendingTopicCache() {
    var removedCount = 0;
    for (var i = localStorage.length - 1; i >= 0; i -= 1) {
      var key = localStorage.key(i);
      if (!isTopicStorageKey(key)) {
        continue;
      }
      var value = localStorage.getItem(key);
      if (isPendingTopicCache(value)) {
        localStorage.removeItem(key);
        removedCount += 1;
      }
    }
    showMessage("已清理 " + removedCount + " 条“待填写”旧缓存，手动修正库已保留。", true);
  }

  function cleanEmptyTitleCorrectionCache() {
    var removedCount = 0;
    for (var i = localStorage.length - 1; i >= 0; i -= 1) {
      var key = localStorage.key(i);
      if (!isTopicStorageKey(key)) {
        continue;
      }
      var value = localStorage.getItem(key);
      if (isLegacyEmptyTitleCache(key, value)) {
        localStorage.removeItem(key);
        removedCount += 1;
      }
    }
    showMessage("已清理 " + removedCount + " 条空标题错误缓存；正常有标题的历史修正已保留。", true);
  }

  function isLegacyEmptyTitleCache(key, value) {
    if (!value) {
      return false;
    }
    if (key === "xhs-topic-correction::") {
      return true;
    }
    if (key.indexOf("xhs-topic-correction::") === 0 && key.indexOf("EMPTY_TITLE") === -1) {
      try {
        var correction = JSON.parse(value);
        return correction && correction.source === "manual" && !normalizeOriginalTitle(correction.originalTitle);
      } catch (error) {
        return false;
      }
    }
    if (key.indexOf("xhs-topic::") === 0 && key.indexOf("EMPTY_TITLE") === -1 && /::$/.test(key)) {
      return true;
    }
    return false;
  }

  function exportTopicCsv() {
    if (!analyzedRows.length) {
      showMessage("请先上传并分析 CSV，再导出带选题的结果。", false);
      return;
    }

    var headers = [
      "选题/菜品名",
      "原始笔记标题",
      "首次发布时间",
      "已发布时长",
      "曝光",
      "观看量",
      "封面点击率",
      "点赞",
      "评论",
      "收藏",
      "分享",
      "赞藏和",
      "互动量",
      "赞藏率",
      "收藏率",
      "状态",
      "运营建议"
    ];
    var rows = getVisibleRows().map(function (row) {
      return [
        row.topic,
        row.title,
        row.publishedText,
        formatDuration(row.ageHours),
        row.impressions,
        row.views,
        formatPercent(row.coverCtr),
        row.likes,
        row.comments,
        row.collects,
        row.shares,
        row.likeCollect,
        row.interactions,
        formatPercent(row.likeCollectRate),
        formatPercent(row.collectRate),
        row.status,
        row.advice
      ];
    });
    var csv = "\uFEFF" + [headers].concat(rows).map(function (line) {
      return line.map(csvCell).join(",");
    }).join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "xhs-analysis-with-topic-" + formatFileDate(new Date()) + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage("已导出带选题 CSV。", true);
  }

  function updateOverview(rows) {
    var summary = buildAccountSummary(rows);

    setText("totalCount", rows.length);
    setText("overviewImpressions", formatInteger(summary.impressions));
    setText("overviewViews", formatInteger(summary.views));
    setText("overviewLikes", formatInteger(summary.likes));
    setText("overviewCollects", formatInteger(summary.collects));
    setText("overviewLikeCollect", formatInteger(summary.likeCollect));
    setText("avgCtr", formatPercent(average(rows, "coverCtr")));
    setText("avgLikeCollectRate", formatPercent(average(rows, "likeCollectRate")));
    setText("avgCollectRate", formatPercent(average(rows, "collectRate")));
    renderStatusDistribution(rows);
  }

  function renderStatusDistribution(rows) {
    if (!statusDistributionGrid) {
      return;
    }
    var distribution = getStatusDistribution(rows);
    if (!distribution.statuses.length) {
      statusDistributionGrid.innerHTML = "<div class=\"empty-status-distribution\">上传 CSV 并分析后显示状态分布。</div>";
      return;
    }

    var total = rows.length || 1;
    statusDistributionGrid.innerHTML = distribution.statuses.map(function (status) {
      var count = distribution.counts[status] || 0;
      var percent = count / total;
      return [
        "<article class=\"status-card " + statusClass(status) + "\" data-tooltip=\"" + escapeHtml(getStatusTooltip(status)) + "\">",
        "<span>" + escapeHtml(status) + "</span>",
        "<strong>" + formatInteger(count) + "</strong>",
        "<small>" + formatPercent(percent) + "</small>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderReportDashboard() {
    if (!trendChart || !engagementTrendChart || !viewsTopChart || !likeCollectTopChart || !growthDistributionChart || !singleStatusChart) {
      return;
    }

    var mode = reportModeSelect ? reportModeSelect.value : "all";
    setReportCardVisibility(".report-single-card", mode !== "compare");
    setReportCardVisibility(".report-compare-card", mode !== "single");
    updateReportIntervalText();

    renderTrendCharts();
    renderCompareTopChart(viewsTopChart, {
      valueKey: "deltaViews",
      emptyMessage: "请先完成多快照对比，才能查看新增观看 Top10。",
      valueFormatter: formatSignedInteger,
      metaBuilder: function (row) {
        return row.intervalLabel;
      }
    });
    renderCompareTopChart(likeCollectTopChart, {
      valueKey: "deltaLikeCollect",
      emptyMessage: "请先完成多快照对比，才能查看新增赞藏和 Top10。",
      valueFormatter: formatSignedInteger,
      metaBuilder: function (row) {
        return "新增点赞 " + formatSignedInteger(row.deltaLikes) +
          " / 新增收藏 " + formatSignedInteger(row.deltaCollects) +
          " · " + row.intervalLabel;
      }
    });
    renderGrowthDistributionChart();
    renderSingleStatusChart();
  }

  function setReportCardVisibility(selector, visible) {
    document.querySelectorAll(selector).forEach(function (card) {
      card.hidden = !visible;
    });
  }

  function updateReportIntervalText() {
    if (!reportIntervalText) {
      return;
    }
    if (!compareIntervalFilter || !compareRows.length) {
      reportIntervalText.textContent = "暂无多快照区间";
      return;
    }
    var selected = compareIntervalFilter.options[compareIntervalFilter.selectedIndex];
    reportIntervalText.textContent = selected ? selected.textContent : "全部区间";
  }

  function renderTrendCharts() {
    var intervals = buildIntervalChartPoints(getChartCompareRows(false));
    renderLineTrendChart(trendChart, intervals, [
      { key: "deltaViews", label: "新增观看量", color: "#c7353f" }
    ], "请先完成多快照对比，才能查看新增观看趋势图。");
    renderLineTrendChart(engagementTrendChart, intervals, [
      { key: "deltaLikeCollect", label: "新增赞藏和", color: "#28784f" },
      { key: "deltaCollects", label: "新增收藏", color: "#2f68b1" },
      { key: "deltaLikes", label: "新增点赞", color: "#9b6a20" }
    ], "请先完成多快照对比，才能查看互动质量趋势图。");
  }

  function renderLineTrendChart(container, intervals, series, emptyMessage) {
    if (!compareRows.length) {
      renderChartEmpty(container, emptyMessage);
      return;
    }
    if (!intervals.length) {
      renderChartEmpty(container, "当前图表过滤条件下没有可展示的对比区间。");
      return;
    }

    var width = 760;
    var height = 280;
    var left = 58;
    var right = 24;
    var top = 24;
    var bottom = 58;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var values = [];
    intervals.forEach(function (point) {
      series.forEach(function (item) {
        values.push(Number(point[item.key]) || 0);
      });
    });
    var maxValue = Math.max(0, Math.max.apply(null, values));
    var minValue = Math.min(0, Math.min.apply(null, values));
    if (maxValue === minValue) {
      maxValue += 1;
      minValue -= 1;
    }

    function x(index) {
      if (intervals.length === 1) {
        return left + plotWidth / 2;
      }
      return left + (plotWidth * index / (intervals.length - 1));
    }

    function y(value) {
      return top + (maxValue - value) * plotHeight / (maxValue - minValue);
    }

    var labelStep = Math.max(1, Math.ceil(intervals.length / 6));
    var gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (ratio) {
      var lineY = top + plotHeight * ratio;
      var value = maxValue - (maxValue - minValue) * ratio;
      return [
        "<line x1=\"" + left + "\" y1=\"" + lineY + "\" x2=\"" + (width - right) + "\" y2=\"" + lineY + "\" class=\"chart-grid-line\"></line>",
        "<text x=\"" + (left - 10) + "\" y=\"" + (lineY + 4) + "\" class=\"chart-axis-label\" text-anchor=\"end\">" + escapeHtml(formatCompactNumber(value)) + "</text>"
      ].join("");
    }).join("");

    var lines = series.map(function (item) {
      var points = intervals.map(function (point, index) {
        return x(index) + "," + y(Number(point[item.key]) || 0);
      }).join(" ");
      var circles = intervals.map(function (point, index) {
        var value = Number(point[item.key]) || 0;
        return "<circle cx=\"" + x(index) + "\" cy=\"" + y(value) + "\" r=\"4\" fill=\"" + item.color + "\"><title>" +
          escapeHtml(point.label + "\n" + item.label + "：" + formatSignedInteger(value)) +
          "</title></circle>";
      }).join("");
      return "<polyline points=\"" + points + "\" fill=\"none\" stroke=\"" + item.color + "\" stroke-width=\"2.5\"></polyline>" + circles;
    }).join("");

    var xLabels = intervals.map(function (point, index) {
      if (intervals.length > 6 && index % labelStep !== 0 && index !== intervals.length - 1) {
        return "";
      }
      return "<text x=\"" + x(index) + "\" y=\"" + (height - 22) + "\" class=\"chart-axis-label\" text-anchor=\"middle\">" +
        escapeHtml(shortText(point.label, 16)) +
        "<title>" + escapeHtml(point.label) + "</title></text>";
    }).join("");

    var legend = series.map(function (item) {
      return "<span><i style=\"background:" + item.color + "\"></i>" + escapeHtml(item.label) + "</span>";
    }).join("");

    container.innerHTML = [
      "<div class=\"chart-legend\">" + legend + "</div>",
      "<svg class=\"line-chart\" viewBox=\"0 0 " + width + " " + height + "\" role=\"img\" aria-label=\"多快照趋势折线图\">",
        gridLines,
        "<line x1=\"" + left + "\" y1=\"" + top + "\" x2=\"" + left + "\" y2=\"" + (height - bottom) + "\" class=\"chart-axis-line\"></line>",
        "<line x1=\"" + left + "\" y1=\"" + (height - bottom) + "\" x2=\"" + (width - right) + "\" y2=\"" + (height - bottom) + "\" class=\"chart-axis-line\"></line>",
        lines,
        xLabels,
      "</svg>"
    ].join("");
  }

  function buildIntervalChartPoints(rows) {
    var grouped = {};
    rows.forEach(function (row) {
      if (!grouped[row.intervalKey]) {
        grouped[row.intervalKey] = {
          key: row.intervalKey,
          label: row.intervalLabel,
          deltaViews: 0,
          deltaLikeCollect: 0,
          deltaCollects: 0,
          deltaLikes: 0
        };
      }
      grouped[row.intervalKey].deltaViews += Number(row.deltaViews) || 0;
      grouped[row.intervalKey].deltaLikeCollect += Number(row.deltaLikeCollect) || 0;
      grouped[row.intervalKey].deltaCollects += Number(row.deltaCollects) || 0;
      grouped[row.intervalKey].deltaLikes += Number(row.deltaLikes) || 0;
    });
    return Object.keys(grouped).sort(function (a, b) {
      return Number(a.replace("interval-", "")) - Number(b.replace("interval-", ""));
    }).map(function (key) {
      return grouped[key];
    });
  }

  function renderCompareTopChart(container, options) {
    var rows = getChartCompareRows(true);
    if (!rows.length) {
      renderChartEmpty(container, options.emptyMessage);
      return;
    }

    var topMode = reportTopModeSelect ? reportTopModeSelect.value : "aggregate";
    var sourceRows = topMode === "record" ? rows : aggregateCompareRowsByWork(rows);
    var items = sourceRows.slice().sort(function (a, b) {
      return (Number(b[options.valueKey]) || 0) - (Number(a[options.valueKey]) || 0);
    }).slice(0, 10).map(function (row) {
      var label = getChartWorkLabel(row);
      var value = Number(row[options.valueKey]) || 0;
      var meta = topMode === "record" ? options.metaBuilder(row) : buildAggregateChartMeta(row, options.valueKey);
      return {
        label: label,
        value: value,
        displayValue: options.valueFormatter(value),
        meta: meta,
        title: buildTopChartTitle(row, label, meta)
      };
    });

    renderHorizontalBars(container, items, { signed: true });
  }

  function renderGrowthDistributionChart() {
    var rows = getChartCompareRows(true);
    if (!rows.length) {
      renderChartEmpty(growthDistributionChart, compareRows.length ? "当前区间没有可展示的增长判断。" : "请先完成多快照对比，才能查看增长判断分布。");
      return;
    }

    var counts = countCompareStatuses(rows);
    var items = Object.keys(counts).sort(compareGrowthStatusOrder).map(function (status) {
      return {
        label: status,
        value: counts[status],
        displayValue: formatInteger(counts[status]),
        meta: "当前区间内 " + counts[status] + " 条",
        title: status + "：" + counts[status] + " 条"
      };
    });
    renderHorizontalBars(growthDistributionChart, items, { signed: false });
  }

  function buildAggregateChartMeta(row, valueKey) {
    if (valueKey === "deltaLikeCollect") {
      return "总新增 · 点赞 " + formatSignedInteger(row.deltaLikes) +
        " / 收藏 " + formatSignedInteger(row.deltaCollects) +
        " · " + row.rangeText;
    }
    return "总新增 · " + row.rangeText;
  }

  function getChartCompareRows(useSelectedInterval) {
    var rows = useSelectedInterval ? getCompareRowsForSelectedInterval() : compareRows.slice();
    if (reportIncludeAnomalies && reportIncludeAnomalies.checked) {
      return rows;
    }
    return rows.filter(isChartEligibleCompareRow);
  }

  function isChartEligibleCompareRow(row) {
    if (!row) {
      return false;
    }
    if (row.compareType === "missing" || row.compareType === "new") {
      return false;
    }
    if (row.matchRisk) {
      return false;
    }
    if (!normalizeOriginalTitle(row.title) && (!row.topic || row.topic === "待填写")) {
      return false;
    }
    return true;
  }

  function aggregateCompareRowsByWork(rows) {
    var groups = {};
    rows.forEach(function (row) {
      var key = row.snapshotKey || row.noteKey || row.title + "__" + row.publishedText;
      if (!groups[key]) {
        groups[key] = {
          snapshotKey: key,
          topic: row.topic,
          title: row.title,
          publishedText: row.publishedText,
          matchRisk: !!row.matchRisk,
          intervalStartText: row.intervalStartText,
          intervalEndText: row.intervalEndText,
          startIndex: row.intervalIndex,
          endIndex: row.intervalIndex,
          intervalCount: 0,
          deltaViews: 0,
          deltaLikes: 0,
          deltaCollects: 0,
          deltaLikeCollect: 0,
          deltaComments: 0,
          deltaShares: 0,
          deltaFollowers: 0
        };
      }
      var group = groups[key];
      group.intervalCount += 1;
      group.deltaViews += Number(row.deltaViews) || 0;
      group.deltaLikes += Number(row.deltaLikes) || 0;
      group.deltaCollects += Number(row.deltaCollects) || 0;
      group.deltaLikeCollect += Number(row.deltaLikeCollect) || 0;
      group.deltaComments += Number(row.deltaComments) || 0;
      group.deltaShares += Number(row.deltaShares) || 0;
      group.deltaFollowers += Number(row.deltaFollowers) || 0;
      if (row.intervalIndex < group.startIndex) {
        group.startIndex = row.intervalIndex;
        group.intervalStartText = row.intervalStartText;
      }
      if (row.intervalIndex >= group.endIndex) {
        group.endIndex = row.intervalIndex;
        group.intervalEndText = row.intervalEndText;
      }
    });
    return Object.keys(groups).map(function (key) {
      var group = groups[key];
      group.rangeText = group.intervalStartText + " -> " + group.intervalEndText;
      return group;
    });
  }

  function getChartWorkLabel(row) {
    if (row.topic && row.topic !== "待填写") {
      return row.topic;
    }
    if (normalizeOriginalTitle(row.title)) {
      return row.title;
    }
    return getUnnamedWorkLabel(row.snapshotKey || row.noteKey);
  }

  function getUnnamedWorkLabel(key) {
    var match = String(key || "").match(/row-(\d+)/);
    var index = match ? Number(match[1]) + 1 : 1;
    return "未命名作品 " + index;
  }

  function buildTopChartTitle(row, label, meta) {
    return [
      "选题：" + label,
      "原始标题：" + (row.title || "空标题"),
      "区间：" + (row.intervalLabel || row.rangeText || meta || ""),
      "新增观看：" + formatSignedInteger(row.deltaViews || 0),
      "新增点赞：" + formatSignedInteger(row.deltaLikes || 0),
      "新增收藏：" + formatSignedInteger(row.deltaCollects || 0),
      "新增赞藏和：" + formatSignedInteger(row.deltaLikeCollect || 0),
      "匹配风险：" + (row.matchRisk ? "是" : "否")
    ].join("\n");
  }

  function renderSingleStatusChart() {
    if (!analyzedRows.length) {
      renderChartEmpty(singleStatusChart, "请先完成单份 CSV 分析，才能查看当前笔记状态分布。");
      return;
    }

    var distribution = getStatusDistribution(analyzedRows);
    var items = distribution.statuses.map(function (status) {
      return {
        label: status,
        value: distribution.counts[status],
        displayValue: formatInteger(distribution.counts[status]),
        meta: "全部数据内 " + distribution.counts[status] + " 条",
        title: status + "：" + distribution.counts[status] + " 条"
      };
    });
    renderHorizontalBars(singleStatusChart, items, { signed: false });
  }

  function renderHorizontalBars(container, items, options) {
    var maxValue = items.reduce(function (max, item) {
      return Math.max(max, Math.abs(Number(item.value) || 0));
    }, 0) || 1;

    container.innerHTML = "<div class=\"bar-list\">" + items.map(function (item) {
      var rawValue = Number(item.value) || 0;
      var width = Math.max(4, Math.min(100, Math.abs(rawValue) / maxValue * 100));
      var negativeClass = rawValue < 0 ? " is-negative" : "";
      return [
        "<div class=\"bar-row\" title=\"" + escapeHtml(item.title || item.label) + "\">",
          "<div class=\"bar-row-main\">",
            "<span class=\"bar-label\">" + escapeHtml(shortText(item.label, 24)) + "</span>",
            "<strong>" + escapeHtml(item.displayValue) + "</strong>",
          "</div>",
          "<div class=\"bar-track\"><div class=\"bar-fill" + negativeClass + "\" style=\"width:" + width.toFixed(2) + "%\"></div></div>",
          "<div class=\"bar-meta\">" + escapeHtml(item.meta || "") + "</div>",
        "</div>"
      ].join("");
    }).join("") + "</div>";
  }

  function renderChartEmpty(container, message) {
    container.innerHTML = "<div class=\"chart-empty\">" + escapeHtml(message) + "</div>";
  }

  function shortText(text, maxLength) {
    var value = String(text || "");
    if (value.length <= maxLength) {
      return value;
    }
    return value.slice(0, maxLength - 1) + "…";
  }

  function formatCompactNumber(value) {
    var number = Number(value) || 0;
    var abs = Math.abs(number);
    if (abs >= 10000) {
      return formatNumber(number / 10000, 1) + "万";
    }
    return formatInteger(Math.round(number));
  }

  function applyStaticTooltips() {
    setTooltipForSelector("label[for='csvFile']", "上传从小红书导出的 CSV 文件。Excel 文件请先另存为 CSV 后再上传。");
    setTooltipForSelector("label[for='observationTime']", "用于计算每篇笔记已经发布了多久。格式示例：2026-05-27 18:00。");
    setTooltipForSelector("#analyzeBtn", "读取当前 CSV，并根据观察时间计算每篇笔记的表现状态。");
    setTooltipForSelector("#exportTopicBtn", "导出当前分析结果，包含选题、原始标题、数据指标、状态和运营建议，适合归档本次复盘。");
    setTooltipForSelector("#reidentifyTopicBtn", "使用当前自动识别规则重新识别选题。不会覆盖你手动确认过的选题。");
    setTooltipForSelector("#applyCorrectionBtn", "把历史手动修正过的选题重新套用到当前数据里。");
    setTooltipForSelector("#exportCorrectionBtn", "导出你手动修正过的标题与选题对应关系，用于备份。");
    setTooltipForSelector(".file-action", "导入之前备份的选题修正库，恢复历史修正记录。");
    setTooltipForSelector("#cleanPendingCacheBtn", "清除无效的“待填写”缓存，不会删除你手动修正过的选题。");
    setTooltipForSelector("#cleanEmptyTitleCacheBtn", "清理旧规则造成的空标题错误修正，不会删除正常有标题的历史修正。");
    setTooltipForSelector("label[for='reportModeSelect']", "切换全部报表、单份 CSV 报表或多快照增长报表。");
    setTooltipForSelector("label[for='reportTopModeSelect']", "按作品汇总会把同一作品多个区间合并；按区间记录会保留每个区间的单条记录。");
    setTooltipForSelector(".report-checkbox", "默认关闭时，图表会排除快照缺失、新增笔记、匹配风险和未确认选题记录。");
    setTooltipForSelector("label[for='lifecycleFilterSelect']", "按笔记已发布时长筛选，方便查看不同生命周期阶段的表现。");
    setTooltipForSelector("label[for='statusFilterSelect']", "根据当前 CSV 里真实出现的状态动态生成，可和生命周期筛选同时使用。");
    setTooltipForSelector(".compare-section h2", "用于比较多个时间点导出的 CSV，判断每个时间段内作品新增数据变化。");
    setTooltipForSelector("#addSnapshotBtn", "继续添加一个时间点的 CSV 快照。");
    setTooltipForSelector("#compareBtn", "读取多个 CSV，按观察时间排序，并计算相邻快照之间的新增数据。");
    setTooltipForSelector("#exportCompareBtn", "导出当前多快照对比表，包含区间、新增数据、增长判断和运营建议。");
    setTooltipForSelector("label[for='compareIntervalFilter']", "按两个相邻快照之间的对比区间筛选，例如 10:00 到 14:00。");
    setTooltipForSelector("label[for='compareStatusFilter']", "按本次多快照对比中实际出现的增长判断筛选。");
    setTooltipForSelector("label[for='compareSortSelect']", "按新增观看、新增曝光、每小时新增观看等指标排序。");
    setTooltipForSelector("#generateSingleRecapBtn", "根据当前单份 CSV 的整体数据、状态分布和重点作品，生成一段运营复盘文字。");
    setTooltipForSelector("#generateCompareRecapBtn", "根据多个快照之间的新增数据，生成增长复盘和下一步建议。");
    setTooltipForSelector("#generateAiRecapBtn", "把页面已计算好的结构化摘要发给本地后端，由 DeepSeek 生成 AI 复盘建议。");
    setTooltipForSelector("#copyRecapBtn", "复制当前生成的复盘文字，方便粘贴到飞书、Excel 或运营记录。");
    setTooltipForSelector("#clearRecapBtn", "清空当前复盘文本框里的内容。");
    setTooltipForSelector(".visual-mode-control", "极简模式关闭大部分动效；标准模式保留静态高级背景和少量交互；高级动效启用流体背景、贴片漂浮和入场动画。");

    document.querySelectorAll(".metric-card span").forEach(function (element) {
      var tooltip = getMetricTooltip(element.textContent.trim());
      if (tooltip) {
        element.setAttribute("data-tooltip", tooltip);
      }
    });

    document.querySelectorAll("thead th").forEach(function (element) {
      var tooltip = getTableHeaderTooltip(element.textContent.trim());
      if (tooltip) {
        element.setAttribute("data-tooltip", tooltip);
      }
    });
  }

  function setTooltipForSelector(selector, tooltip) {
    var element = document.querySelector(selector);
    if (element) {
      element.setAttribute("data-tooltip", tooltip);
    }
  }

  function initTooltips() {
    var tooltip = document.createElement("div");
    tooltip.className = "global-tooltip";
    document.body.appendChild(tooltip);

    document.addEventListener("mouseover", function (event) {
      var target = event.target.closest("[data-tooltip]");
      if (!target) {
        return;
      }
      tooltip.textContent = target.getAttribute("data-tooltip");
      tooltip.classList.add("show");
      positionTooltip(event, tooltip);
    });

    document.addEventListener("mousemove", function (event) {
      if (tooltip.classList.contains("show")) {
        positionTooltip(event, tooltip);
      }
    });

    document.addEventListener("mouseout", function (event) {
      if (event.target.closest("[data-tooltip]")) {
        tooltip.classList.remove("show");
      }
    });
  }

  function positionTooltip(event, tooltip) {
    var offset = 14;
    var left = event.clientX + offset;
    var top = event.clientY + offset;
    var rect = tooltip.getBoundingClientRect();
    var maxLeft = window.innerWidth - rect.width - 10;
    var maxTop = window.innerHeight - rect.height - 10;

    if (left > maxLeft) {
      left = event.clientX - rect.width - offset;
    }
    if (top > maxTop) {
      top = event.clientY - rect.height - offset;
    }

    tooltip.style.left = Math.max(10, left) + "px";
    tooltip.style.top = Math.max(10, top) + "px";
  }

  function getMetricTooltip(label) {
    var tooltips = {
      "总笔记数": "当前 CSV 中参与分析的笔记总数。",
      "爆款数": "根据当前规则被判断为爆款的笔记数量。",
      "爆款潜力数": "发布初期观看和赞藏表现较好，可能继续放量的笔记数量。",
      "优质数": "互动质量较好，后续值得复盘或复用的笔记数量。",
      "优质低流量数": "内容反馈不错，但观看量偏低，可能适合换标题、换封面或二发。",
      "冷启动失败数": "发布后初始观看和互动都偏弱的笔记数量。",
      "疑似尾流数": "单次快照下判断可能进入低速增长阶段的笔记数量。第一版不能绝对判断尾流。",
      "平均封面点击率": "所有笔记封面点击率的平均值，用于粗略判断封面吸引力。",
      "平均赞藏率": "平均每次观看带来的点赞和收藏比例，用于判断内容质量。",
      "平均收藏率": "平均每次观看带来的收藏比例，用于判断内容是否有保存价值。",
      "笔记数": "当前统计范围内的笔记数量。",
      "总曝光": "当前 CSV 中所有笔记曝光量之和。小红书曝光字段可能存在延迟。",
      "总观看量": "当前 CSV 中所有笔记观看量之和，也就是小眼睛总数。",
      "总点赞": "当前 CSV 中所有笔记点赞数之和。",
      "总收藏": "当前 CSV 中所有笔记收藏数之和。",
      "总评论": "当前 CSV 中所有笔记评论数之和。",
      "总分享": "当前 CSV 中所有笔记分享数之和。",
      "总涨粉": "当前 CSV 中所有笔记带来的涨粉数之和。",
      "总赞藏和": "点赞数与收藏数相加，用于快速判断内容反馈强弱。",
      "总互动量": "点赞、收藏、评论、分享的合计。",
      "整体赞藏率": "总赞藏和 ÷ 总观看量，用于判断整体内容质量。",
      "整体收藏率": "总收藏 ÷ 总观看量，用于判断整体收藏价值。",
      "整体评论率": "总评论 ÷ 总观看量，用于判断整体评论活跃度。",
      "整体分享率": "总分享 ÷ 总观看量，用于判断内容传播意愿。",
      "整体涨粉率": "总涨粉 ÷ 总观看量，用于判断内容转粉效率。",
      "整体点击转化": "总观看量 ÷ 总曝光，用于粗略判断曝光转化为观看的效率。"
    };
    return tooltips[label] || getCompareMetricTooltip(label);
  }

  function getTableHeaderTooltip(label) {
    var tooltips = {
      "选题/菜品名": "工具自动识别或你手动修正后的真实选题，用于后续复盘。",
      "原始笔记标题": "小红书导出的原始标题，通常来自笔记正文上方标题。",
      "首次发布时间": "小红书记录的笔记首次发布时间。",
      "已发布时长": "当前观察时间减去首次发布时间，用于判断笔记处于哪个生命周期阶段。",
      "曝光": "小红书给这篇笔记的展示次数。该字段可能有延迟。",
      "观看量": "用户实际点进观看的次数，也就是小眼睛数据。",
      "封面点击率": "观看量与曝光之间的比例，用于判断封面和标题吸引力。",
      "点赞": "该笔记获得的点赞数量。",
      "评论": "该笔记获得的评论数量。",
      "收藏": "该笔记获得的收藏数量，是食谱类内容的重要指标。",
      "涨粉": "该笔记带来的新增粉丝数量。",
      "分享": "该笔记被分享的次数。",
      "人均观看时长": "用户平均观看这条笔记的时长。",
      "弹幕": "该笔记收到的弹幕数量。",
      "赞藏和": "点赞 + 收藏，是判断内容反馈的核心指标。",
      "互动量": "点赞 + 收藏 + 评论 + 分享。",
      "赞藏率": "赞藏和 ÷ 观看量，用于判断看过的人有多少愿意点赞或收藏。",
      "收藏率": "收藏 ÷ 观看量，用于判断食谱内容的收藏价值。",
      "评论率": "评论 ÷ 观看量，用于判断讨论意愿。",
      "分享率": "分享 ÷ 观看量，用于判断传播意愿。",
      "涨粉率": "涨粉 ÷ 观看量，用于判断转粉效率。",
      "每小时观看": "观看量 ÷ 已发布小时数，用于观察当前增长速度。",
      "每小时赞藏": "赞藏和 ÷ 已发布小时数，用于观察互动增长速度。",
      "状态": "工具根据观看量、赞藏率、发布时间等规则给出的当前判断。",
      "运营建议": "根据当前状态给出的下一步动作建议，只作为辅助判断。",
      "对比区间": "两个相邻快照之间的时间段，例如 10:00 到 14:00。",
      "前快照观看量": "较早那个快照里的观看量。",
      "后快照观看量": "较晚那个快照里的观看量。",
      "新增观看量": "后一个快照观看量减去前一个快照观看量。",
      "前快照曝光": "较早那个快照里的曝光量。",
      "后快照曝光": "较晚那个快照里的曝光量。",
      "新增曝光": "后一个快照曝光减去前一个快照曝光。",
      "新增点赞": "后一个快照点赞减去前一个快照点赞。",
      "新增收藏": "后一个快照收藏减去前一个快照收藏。",
      "新增评论": "后一个快照评论减去前一个快照评论。",
      "新增分享": "后一个快照分享减去前一个快照分享。",
      "新增涨粉": "后一个快照涨粉减去前一个快照涨粉。",
      "每小时新增观看": "新增观看量除以两个快照之间的小时数，用于判断增长速度。",
      "每小时新增赞藏": "新增赞藏和除以两个快照之间的小时数。",
      "增长判断": "根据相邻快照之间的新增数据给出的增长状态。"
    };
    return tooltips[label] || getCompareMetricTooltip(label);
  }

  function getStatusTooltip(status) {
    var tooltips = {
      "爆款": "观看量和互动率都较强，值得重点复盘和复用。",
      "爆款潜力": "发布初期表现较好，后续可能继续放量，需要继续观察。",
      "优质": "内容反馈不错，适合复盘、二发或同类选题扩展。",
      "优质低流量": "互动质量不错，但观看量不高，可能是分发不足或封面标题问题。",
      "初始曝光正常": "发布早期观看量达到正常启动水平，暂时不要急着判断失败。",
      "初始曝光不足": "发布早期观看偏低，但小红书可能存在延迟推荐，先观察。",
      "冷启动失败": "发布后初始观看和互动都偏弱，暂不优先复用。",
      "疑似尾流": "单次快照下增长速度可能变慢。真正尾流需要多次快照对比确认。",
      "普通": "数据表现没有明显优势，也没有明显失败，继续观察即可。"
    };
    return tooltips[status] || "工具根据当前规则给出的状态判断。";
  }

  function getCompareMetricTooltip(label) {
    var tooltips = {
      "多次 CSV 快照对比": "用于比较多个时间点导出的 CSV，判断每个时间段内作品新增数据变化。",
      "快照": "某一个时间点导出的小红书数据。",
      "快照数量": "本次参与对比的 CSV 快照数量。",
      "对比区间": "两个相邻快照之间的时间段，例如 10:00 到 14:00。",
      "对比区间数量": "按观察时间排序后，相邻快照之间形成的对比段数量。",
      "最早观察时间": "本次多快照中时间最早的观察时间。",
      "最晚观察时间": "本次多快照中时间最晚的观察时间。",
      "总时间跨度": "最晚观察时间减去最早观察时间。",
      "旧快照 CSV": "较早时间导出的小红书数据。",
      "新快照 CSV": "较晚时间导出的小红书数据。",
      "新增观看量": "后一个快照观看量减去前一个快照观看量。",
      "旧观看量": "前一个快照中的观看量。",
      "新观看量": "后一个快照中的观看量。",
      "旧曝光": "前一个快照中的曝光量。",
      "新曝光": "后一个快照中的曝光量。",
      "新增曝光": "后一个快照曝光减去前一个快照曝光。",
      "旧点赞": "前一个快照中的点赞数。",
      "新点赞": "后一个快照中的点赞数。",
      "新增点赞": "后一个快照点赞减去前一个快照点赞。",
      "旧收藏": "前一个快照中的收藏数。",
      "新收藏": "后一个快照中的收藏数。",
      "新增收藏": "后一个快照收藏减去前一个快照收藏。",
      "新增评论": "后一个快照评论减去前一个快照评论。",
      "新增分享": "后一个快照分享减去前一个快照分享。",
      "新增涨粉": "后一个快照涨粉减去前一个快照涨粉。",
      "总新增观看量": "后一个快照总观看量减去前一个快照总观看量。",
      "所有区间总新增曝光": "所有相邻快照区间新增曝光的合计。",
      "所有区间总新增观看量": "所有相邻快照区间新增观看量的合计。",
      "所有区间总新增点赞": "所有相邻快照区间新增点赞的合计。",
      "所有区间总新增收藏": "所有相邻快照区间新增收藏的合计。",
      "所有区间总新增评论": "所有相邻快照区间新增评论的合计。",
      "所有区间总新增分享": "所有相邻快照区间新增分享的合计。",
      "所有区间总新增涨粉": "所有相邻快照区间新增涨粉的合计。",
      "所有区间总新增赞藏和": "所有相邻快照区间新增点赞与新增收藏的合计。",
      "所有区间总新增互动量": "所有相邻快照区间新增点赞、收藏、评论和分享的合计。",
      "新增赞藏和": "新增点赞加新增收藏。",
      "新增互动量": "新增点赞、新增收藏、新增评论和新增分享的合计。",
      "总新增赞藏和": "所有笔记新增点赞与新增收藏的合计。",
      "每小时新增观看": "新增观看量除以两个快照之间的小时数，用于判断增长速度。",
      "平均每小时新增观看": "总新增观看量除以两个快照之间的小时数。",
      "每小时新增赞藏": "新增赞藏和除以两个快照之间的小时数。",
      "平均每小时新增赞藏": "总新增赞藏和除以两个快照之间的小时数。"
    };
    return tooltips[label] || "两份快照之间的新增数据，用于观察这段时间的增长情况。";
  }

  function getCompareStatusTooltip(status) {
    var tooltips = {
      "明显放量": "这段时间新增观看和新增赞藏都较强，建议重点观察。",
      "稳定增长": "这段时间仍有比较明确的新增流量进入。",
      "小幅增长": "有少量新增，继续观察即可。",
      "疑似尾流": "当前时间段新增观看和新增赞藏都很低，可能进入低速阶段。仍建议结合多次快照判断。",
      "基本停滞": "这段时间几乎没有新增，不优先复用。",
      "新增笔记": "这条笔记只出现在后一个快照中，无法计算完整增长。",
      "快照缺失": "这条笔记只出现在前一个快照中，请检查 CSV 是否来自同一账号或导出范围是否一致。"
    };
    return tooltips[status] || "根据两份快照之间的新增数据给出的增长判断。";
  }

  function getTopicConfidenceTooltip(confidence) {
    var tooltips = {
      "自动识别": "工具根据标题规则自动提取出的选题。",
      "疑似": "工具只识别到部分食材或不完整菜名，需要人工确认。",
      "需手填": "工具没有识别出明确选题，需要你手动填写。",
      "手动": "你在页面中手动修改过的选题，优先级最高。",
      "历史修正": "来自你以前手动修正过的选题记录。",
      "已导入": "来自导入文件中已有的选题字段。"
    };
    return tooltips[confidence] || "";
  }

  function updateAccountSummaries(allRows, filteredRows) {
    renderSummaryGrid(allSummaryGrid, buildAccountSummary(allRows));
    renderSummaryGrid(filteredSummaryGrid, buildAccountSummary(filteredRows));
  }

  function updateCompareSummary(rows, context) {
    if (!context) {
      compareSummaryGrid.innerHTML = "";
      return;
    }

    var summary = buildCompareTotals(rows);
    var items = [
      ["快照数量", formatInteger(context.snapshotCount)],
      ["对比区间数量", formatInteger(context.intervalCount)],
      ["最早观察时间", formatDisplayDate(context.startDate.getTime())],
      ["最晚观察时间", formatDisplayDate(context.endDate.getTime())],
      ["总时间跨度", formatNumber(context.totalHours, 1) + " 小时"],
      ["所有区间总新增曝光", formatSignedInteger(summary.deltaImpressions)],
      ["所有区间总新增观看量", formatSignedInteger(summary.deltaViews)],
      ["所有区间总新增点赞", formatSignedInteger(summary.deltaLikes)],
      ["所有区间总新增收藏", formatSignedInteger(summary.deltaCollects)],
      ["所有区间总新增评论", formatSignedInteger(summary.deltaComments)],
      ["所有区间总新增分享", formatSignedInteger(summary.deltaShares)],
      ["所有区间总新增涨粉", formatSignedInteger(summary.deltaFollowers)],
      ["所有区间总新增赞藏和", formatSignedInteger(summary.deltaLikeCollect)],
      ["所有区间总新增互动量", formatSignedInteger(summary.deltaInteractions)]
    ];

    renderCompareSummaryItems(compareSummaryGrid, items);
  }

  function updateIntervalSummaries(rows, context) {
    if (!context) {
      compareIntervalSummaryGrid.innerHTML = "";
      return;
    }

    compareIntervalSummaryGrid.innerHTML = context.snapshots.slice(0, -1).map(function (snapshot, index) {
      var nextSnapshot = context.snapshots[index + 1];
      var intervalKey = "interval-" + index;
      var intervalRows = rows.filter(function (row) {
        return row.intervalKey === intervalKey;
      });
      var summary = buildCompareTotals(intervalRows);
      var counts = countCompareStatuses(intervalRows);
      var intervalHours = (nextSnapshot.date.getTime() - snapshot.date.getTime()) / 3600000;

      return [
        "<article class=\"interval-card\">",
          "<h4>" + escapeHtml(formatDisplayDate(snapshot.date.getTime()) + " -> " + formatDisplayDate(nextSnapshot.date.getTime())) + "</h4>",
          "<div class=\"interval-card-grid\">",
            "<span>间隔</span><strong>" + formatNumber(intervalHours, 1) + " 小时</strong>",
            "<span>新增观看</span><strong>" + formatSignedInteger(summary.deltaViews) + "</strong>",
            "<span>新增点赞</span><strong>" + formatSignedInteger(summary.deltaLikes) + "</strong>",
            "<span>新增收藏</span><strong>" + formatSignedInteger(summary.deltaCollects) + "</strong>",
            "<span>新增赞藏和</span><strong>" + formatSignedInteger(summary.deltaLikeCollect) + "</strong>",
            "<span>明显放量</span><strong>" + formatInteger(counts["明显放量"] || 0) + "</strong>",
            "<span>稳定增长</span><strong>" + formatInteger(counts["稳定增长"] || 0) + "</strong>",
            "<span>疑似尾流</span><strong>" + formatInteger(counts["疑似尾流"] || 0) + "</strong>",
            "<span>基本停滞</span><strong>" + formatInteger(counts["基本停滞"] || 0) + "</strong>",
          "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function buildCompareTotals(rows) {
    return rows.reduce(function (total, row) {
      total.matched += row.compareType === "matched" ? 1 : 0;
      total.newCount += row.compareType === "new" ? 1 : 0;
      total.missingCount += row.compareType === "missing" ? 1 : 0;
      total.deltaImpressions += row.deltaImpressions;
      total.deltaViews += row.deltaViews;
      total.deltaLikes += row.deltaLikes;
      total.deltaCollects += row.deltaCollects;
      total.deltaComments += row.deltaComments;
      total.deltaShares += row.deltaShares;
      total.deltaFollowers += row.deltaFollowers;
      total.deltaLikeCollect += row.deltaLikeCollect;
      total.deltaInteractions += row.deltaInteractions;
      return total;
    }, {
      matched: 0,
      newCount: 0,
      missingCount: 0,
      deltaImpressions: 0,
      deltaViews: 0,
      deltaLikes: 0,
      deltaCollects: 0,
      deltaComments: 0,
      deltaShares: 0,
      deltaFollowers: 0,
      deltaLikeCollect: 0,
      deltaInteractions: 0
    });
  }

  function countCompareStatuses(rows) {
    return rows.reduce(function (result, row) {
      result[row.growthStatus] = (result[row.growthStatus] || 0) + 1;
      return result;
    }, {});
  }

  function renderCompareSummaryItems(container, items) {
    container.innerHTML = items.map(function (item) {
      return "<div class=\"summary-item\"><span data-tooltip=\"" + escapeHtml(getCompareMetricTooltip(item[0])) + "\">" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></div>";
    }).join("");
  }

  function exportCompareCsv() {
    if (!compareRows.length || !compareContext) {
      showMessage("请先完成多快照对比，再导出结果。", false);
      return;
    }

    var headers = [
      "对比区间",
      "区间开始时间",
      "区间结束时间",
      "间隔小时数",
      "选题/菜品名",
      "原始笔记标题",
      "首次发布时间",
      "前快照曝光",
      "后快照曝光",
      "新增曝光",
      "前快照观看量",
      "后快照观看量",
      "新增观看量",
      "新增点赞",
      "新增收藏",
      "新增评论",
      "新增分享",
      "新增涨粉",
      "新增赞藏和",
      "新增互动量",
      "每小时新增观看",
      "每小时新增赞藏",
      "增长判断",
      "运营建议"
    ];
    var rows = getVisibleCompareRows().map(function (row) {
      return [
        row.intervalLabel,
        row.intervalStartText,
        row.intervalEndText,
        formatNumber(row.intervalHours, 1),
        row.topic,
        row.title,
        row.publishedText,
        row.oldImpressions,
        row.newImpressions,
        row.deltaImpressions,
        row.oldViews,
        row.newViews,
        row.deltaViews,
        row.deltaLikes,
        row.deltaCollects,
        row.deltaComments,
        row.deltaShares,
        row.deltaFollowers,
        row.deltaLikeCollect,
        row.deltaInteractions,
        formatNumber(row.deltaViewsPerHour, 1),
        formatNumber(row.deltaLikeCollectPerHour, 1),
        row.growthStatus,
        row.growthAdvice
      ];
    });
    var csv = "\uFEFF" + [headers].concat(rows).map(function (line) {
      return line.map(csvCell).join(",");
    }).join("\r\n");
    downloadCsv(csv, "xhs-multi-snapshot-compare-" + formatFileDate(new Date()) + ".csv");
    showMessage("已导出多快照对比结果 CSV。", true);
  }

  function generateSingleCsvRecap() {
    if (!analyzedRows.length) {
      showMessage("请先完成单份 CSV 分析。", false);
      return;
    }

    var summary = buildAccountSummary(analyzedRows);
    var distribution = getStatusDistribution(analyzedRows);
    var counts = distribution.counts;
    var total = analyzedRows.length;
    var hotRows = analyzedRows.filter(function (row) { return row.status === "爆款"; });
    var lowQualityRows = analyzedRows.filter(function (row) { return row.status === "优质低流量"; });
    var tailRows = analyzedRows.filter(function (row) { return row.status === "疑似尾流"; });
    var failCount = (counts["失败"] || 0) + (counts["冷启动失败"] || 0);
    var normalCount = (counts["普通"] || 0) + (counts["普通观察"] || 0) + (counts["普通偏弱"] || 0);

    var lines = [
      "【单份 CSV 复盘结论】",
      "一、数据概览",
      "本次共分析 " + formatInteger(total) + " 篇笔记，总曝光 " + formatInteger(summary.impressions) +
        "，总观看量 " + formatInteger(summary.views) + "，总点赞 " + formatInteger(summary.likes) +
        "，总收藏 " + formatInteger(summary.collects) + "，总赞藏和 " + formatInteger(summary.likeCollect) +
        "。平均封面点击率 " + formatPercent(average(analyzedRows, "coverCtr")) +
        "，平均赞藏率 " + formatPercent(average(analyzedRows, "likeCollectRate")) +
        "，平均收藏率 " + formatPercent(average(analyzedRows, "collectRate")) + "。",
      "二、状态分布",
      formatStatusDistributionSentence(distribution.statuses, counts, "本次数据中") + "。",
      "三、重点作品",
      "观看量最高：" + formatSingleRowList(topRowsBy(analyzedRows, "views", 3), function (row) {
        return formatInteger(row.views) + "观看";
      }),
      "赞藏和最高：" + formatSingleRowList(topRowsBy(analyzedRows, "likeCollect", 3), function (row) {
        return formatInteger(row.likeCollect) + "赞藏";
      }),
      "收藏率最高：" + formatSingleRowList(topRowsBy(analyzedRows.filter(function (row) { return row.views > 0; }), "collectRate", 3), function (row) {
        return formatPercent(row.collectRate);
      }),
      hotRows.length ? "爆款作品：" + formatSingleRowList(hotRows.slice(0, 5), function (row) {
        return formatInteger(row.views) + "观看，" + formatPercent(row.likeCollectRate) + "赞藏率";
      }) : "爆款作品：暂无。",
      lowQualityRows.length ? "优质低流量作品：" + formatSingleRowList(lowQualityRows.slice(0, 5), function (row) {
        return formatInteger(row.views) + "观看，" + formatPercent(row.likeCollectRate) + "赞藏率";
      }) : "优质低流量作品：暂无。",
      tailRows.length ? "疑似尾流作品共 " + formatInteger(tailRows.length) + " 条，代表作品：" + formatSingleRowList(tailRows.slice(0, 5), function (row) {
        return formatInteger(row.views) + "观看";
      }) : "疑似尾流作品：暂无。",
      "四、运营判断",
      buildSingleOperationJudgement({
        hotCount: hotRows.length,
        tailCount: tailRows.length,
        lowQualityCount: lowQualityRows.length,
        failCount: failCount,
        normalCount: normalCount,
        total: total
      }),
      "五、下一步建议",
      buildSingleNextActions({
        hotCount: hotRows.length,
        tailCount: tailRows.length,
        lowQualityCount: lowQualityRows.length,
        failCount: failCount
      }).join("\n")
    ];

    recapTextarea.value = lines.join("\n\n");
    showMessage("已生成单份 CSV 复盘结论。", true);
  }

  function generateMultiSnapshotRecap() {
    if (!compareRows.length || !compareContext) {
      showMessage("请先完成多快照对比。", false);
      return;
    }

    var totals = buildCompareTotals(compareRows);
    var counts = countCompareStatuses(compareRows);
    var statuses = Object.keys(counts).sort(compareGrowthStatusOrder);
    var obviousRows = compareRows.filter(function (row) { return row.growthStatus === "明显放量"; });
    var stableRows = compareRows.filter(function (row) { return row.growthStatus === "稳定增长"; });
    var tailRows = compareRows.filter(function (row) { return row.growthStatus === "疑似尾流"; });
    var stalledRows = compareRows.filter(function (row) { return row.growthStatus === "基本停滞"; });
    var repeatedLow = findRepeatedLowGrowthRows(compareRows);
    var reboundRows = findReboundRows(compareRows);

    var lines = [
      "【多快照增长复盘结论】",
      "一、快照概览",
      "本次上传 " + formatInteger(compareContext.snapshotCount) + " 个快照，形成 " + formatInteger(compareContext.intervalCount) +
        " 个对比区间。最早观察时间 " + formatDisplayDate(compareContext.startDate.getTime()) +
        "，最晚观察时间 " + formatDisplayDate(compareContext.endDate.getTime()) +
        "，总时间跨度 " + formatNumber(compareContext.totalHours, 1) + " 小时。",
      "二、总新增数据",
      "所有区间合计新增曝光 " + formatSignedInteger(totals.deltaImpressions) +
        "，新增观看 " + formatSignedInteger(totals.deltaViews) +
        "，新增点赞 " + formatSignedInteger(totals.deltaLikes) +
        "，新增收藏 " + formatSignedInteger(totals.deltaCollects) +
        "，新增评论 " + formatSignedInteger(totals.deltaComments) +
        "，新增分享 " + formatSignedInteger(totals.deltaShares) +
        "，新增涨粉 " + formatSignedInteger(totals.deltaFollowers) +
        "，新增赞藏和 " + formatSignedInteger(totals.deltaLikeCollect) +
        "，新增互动量 " + formatSignedInteger(totals.deltaInteractions) + "。",
      "三、区间表现",
      buildIntervalRecapLines(compareRows, compareContext).join("\n"),
      "四、增长状态分布",
      formatStatusDistributionSentence(statuses, counts, "多快照对比结果中") + "。",
      "五、重点增长作品",
      "新增观看Top5：" + formatCompareRowList(topRowsBy(compareRows, "deltaViews", 5), "deltaViews"),
      "新增赞藏和Top5：" + formatCompareRowList(topRowsBy(compareRows, "deltaLikeCollect", 5), "deltaLikeCollect"),
      "每小时新增观看Top5：" + formatCompareRowList(topRowsBy(compareRows, "deltaViewsPerHour", 5), "deltaViewsPerHour"),
      obviousRows.length ? "明显放量作品：" + formatCompareRowList(obviousRows.slice(0, 5), "deltaViews") : "明显放量作品：暂无。",
      tailRows.length ? "疑似尾流作品：" + formatCompareRowList(tailRows.slice(0, 5), "deltaViews") : "疑似尾流作品：暂无。",
      stalledRows.length ? "基本停滞作品：" + formatCompareRowList(stalledRows.slice(0, 5), "deltaViews") : "基本停滞作品：暂无。",
      "六、运营判断",
      buildCompareOperationJudgement({
        obviousCount: obviousRows.length,
        stableCount: stableRows.length,
        tailCount: tailRows.length,
        stalledCount: stalledRows.length,
        repeatedLow: repeatedLow,
        reboundRows: reboundRows
      }),
      "七、下一步动作建议",
      buildCompareNextActions({
        obviousCount: obviousRows.length,
        stableCount: stableRows.length,
        tailCount: tailRows.length,
        stalledCount: stalledRows.length,
        totalDeltaViews: totals.deltaViews,
        totalHours: compareContext.totalHours
      }).join("\n")
    ];

    recapTextarea.value = lines.join("\n\n");
    showMessage("已生成多快照增长复盘结论。", true);
  }

  function copyRecapText() {
    var text = recapTextarea.value.trim();
    if (!text) {
      showMessage("请先生成复盘结论。", false);
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showMessage("已复制。", true);
      }).catch(function () {
        fallbackCopyText(text);
      });
      return;
    }

    fallbackCopyText(text);
  }

  function fallbackCopyText(text) {
    recapTextarea.focus();
    recapTextarea.select();
    try {
      document.execCommand("copy");
      showMessage("已复制。", true);
    } catch (error) {
      showMessage("复制失败，请手动选中文本复制。", false);
    }
    recapTextarea.setSelectionRange(text.length, text.length);
  }

  function clearRecapText() {
    recapTextarea.value = "";
    setAiWarning("");
    showMessage("已清空复盘结论。", true);
  }

  function generateAiRecap() {
    var payload = buildAiAnalysisPayload();
    if (!payload.singleCsv && !payload.multiSnapshot) {
      showMessage("请先完成单份 CSV 分析或多快照对比，再生成 AI 复盘。", false);
      return;
    }
    if (!window.fetch) {
      showMessage("AI 分析失败：当前浏览器不支持 fetch，请换用新版浏览器。", false);
      return;
    }

    var originalText = generateAiRecapBtn.textContent;
    var controller = window.AbortController ? new AbortController() : null;
    var timeoutId = controller ? window.setTimeout(function () {
      controller.abort();
    }, 90000) : null;

    generateAiRecapBtn.disabled = true;
    generateAiRecapBtn.textContent = "AI 分析中...";
    setAiWarning("");
    resetAiRunStatus();
    recapTextarea.value = "AI 正在根据当前页面的结构化摘要生成复盘结论，请稍候...";
    recapTextarea.scrollTop = 0;

    fetch(getAiApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dataPackage: payload
      }),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        return response.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!response.ok || !data.ok) {
            data.httpStatus = data.status || response.status;
            data.errorType = data.error || "DeepSeek API 调用失败";
            throw data;
          }
          return data;
        });
      })
      .then(function (data) {
        recapTextarea.value = data.content || "";
        recapTextarea.scrollTop = 0;
        setAiWarning(data.warning || "");
        if (data.model && aiModelText) {
          aiModelText.textContent = data.model;
        }
        updateAiRunStatus(data);
        showMessage("AI 复盘结论已生成。", true);
      })
      .catch(function (error) {
        var failure = formatAiFailure(error);
        recapTextarea.value = failure.detailText;
        recapTextarea.scrollTop = 0;
        setAiWarning("");
        updateAiRunStatus(error || {});
        showMessage(failure.messageText, false);
      })
      .finally(function () {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        generateAiRecapBtn.disabled = false;
        generateAiRecapBtn.textContent = originalText;
      });
  }

  function updateAiStatusBar() {
    if (!aiBasisText) {
      return;
    }
    aiBasisText.textContent = getAiBasisText();
  }

  function getAiBasisText() {
    var hasSingle = analyzedRows.length > 0;
    var hasCompare = compareRows.length > 0 && !!compareContext;

    if (!hasSingle && !hasCompare) {
      return "暂无可分析数据";
    }
    if (hasSingle && !hasCompare) {
      return "当前仅基于单份 CSV 分析，无法准确判断新增增长、二次推荐和确认尾流。";
    }
    if (!hasSingle && hasCompare) {
      return "当前基于多快照增长数据分析，可判断新增增长和疑似尾流。";
    }
    return "当前基于单份 CSV 状态 + 多快照增长数据综合分析。";
  }

  function refreshAiModelStatus() {
    if (!aiModelText || !window.fetch) {
      return;
    }
    fetch(getAiHealthUrl())
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        aiModelText.textContent = data && data.model ? data.model : "未知";
        if (aiConfiguredTokensText) {
          aiConfiguredTokensText.textContent = data && data.maxTokens ? String(data.maxTokens) : "未知";
        }
      })
      .catch(function () {
        aiModelText.textContent = "后端未连接";
        if (aiConfiguredTokensText) {
          aiConfiguredTokensText.textContent = "后端未连接";
        }
      });
  }

  function resetAiRunStatus() {
    setTextContent(aiActualTokensText, "生成中...");
    setTextContent(aiAutoContinueText, "否");
    setTextContent(aiContinueCountText, "0");
    setTextContent(aiFinishReasonText, "生成中...");
    setTextContent(aiTruncatedText, "否");
    updateAiUsageStatus(null, "生成中...");
  }

  function updateAiRunStatus(data) {
    if (data.model && aiModelText) {
      aiModelText.textContent = data.model;
    }
    if (data.configuredMaxTokens && aiConfiguredTokensText) {
      aiConfiguredTokensText.textContent = String(data.configuredMaxTokens);
    }
    setTextContent(aiActualTokensText, data.actualMaxTokens ? String(data.actualMaxTokens) : "未知");
    setTextContent(aiAutoContinueText, data.autoContinued ? "是" : "否");
    setTextContent(aiContinueCountText, typeof data.continueCount === "number" ? String(data.continueCount) : "0");
    setTextContent(aiFinishReasonText, data.finishReason || "未知");
    setTextContent(aiTruncatedText, data.possibleTruncated ? "是" : "否");
    updateAiUsageStatus(data.usage);
  }

  function updateAiUsageStatus(usage, fallbackText) {
    var emptyText = fallbackText || "暂无 token 用量数据";
    if (!usage) {
      setTextContent(aiPromptTokensText, emptyText);
      setTextContent(aiCompletionTokensText, emptyText);
      setTextContent(aiTotalTokensText, emptyText);
      return;
    }
    setTextContent(aiPromptTokensText, formatInteger(usage.prompt_tokens || 0));
    setTextContent(aiCompletionTokensText, formatInteger(usage.completion_tokens || 0));
    setTextContent(aiTotalTokensText, formatInteger(usage.total_tokens || 0));
  }

  function setTextContent(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function setAiWarning(message) {
    if (!aiWarningBox) {
      return;
    }
    if (!message) {
      aiWarningBox.hidden = true;
      aiWarningBox.textContent = "";
      return;
    }
    aiWarningBox.hidden = false;
    aiWarningBox.textContent = message;
  }

  function formatAiFailure(error) {
    if (error && error.name === "AbortError") {
      return {
        messageText: "AI 分析失败：请求超时。原分析器功能不受影响。",
        detailText: [
          "AI 分析失败",
          "",
          "错误类型：请求超时",
          "HTTP 状态码：无",
          "后端返回信息：DeepSeek 响应时间过长，请稍后重试。",
          "当前 model：未知",
          "",
          "提示：原分析器功能不受影响，CSV 分析、多快照对比、筛选、合计仍可正常使用。"
        ].join("\n")
      };
    }

    var errorType = (error && (error.errorType || error.error)) || "DeepSeek API 调用失败";
    var status = (error && (error.httpStatus || error.status)) || "未知";
    var message = (error && error.message) || "请检查 API Key、模型名、网络连接和 DeepSeek 账号余额。";
    var model = (error && error.model) || "未知";

    return {
      messageText: "AI 分析失败：" + errorType + "，HTTP 状态码：" + status + "，" + message + "。原分析器功能不受影响。",
      detailText: [
        "AI 分析失败",
        "",
        "错误类型：" + errorType,
        "HTTP 状态码：" + status,
        "后端返回信息：" + message,
        "当前 model：" + model,
        "",
        "提示：原分析器功能不受影响，CSV 分析、多快照对比、筛选、合计仍可正常使用。"
      ].join("\n")
    };
  }

  function getAiApiUrl() {
    if (window.location.protocol === "file:") {
      return "http://127.0.0.1:8787/api/ai-recap";
    }
    return "/api/ai-recap";
  }

  function getAiHealthUrl() {
    if (window.location.protocol === "file:") {
      return "http://127.0.0.1:8787/api/health";
    }
    return "/api/health";
  }

  function buildAiAnalysisPayload() {
    return {
      project: "小红书笔记生命周期分析器 AI 实验版",
      generatedAt: new Date().toISOString(),
      dataPolicy: "仅包含页面已计算的结构化摘要，不包含完整 CSV 原始内容。",
      singleCsv: analyzedRows.length ? buildSingleAiSummary(analyzedRows) : null,
      multiSnapshot: compareRows.length && compareContext ? buildMultiSnapshotAiSummary(compareRows, compareContext) : null
    };
  }

  function buildSingleAiSummary(rows) {
    var summary = buildAccountSummary(rows);
    var distribution = getStatusDistribution(rows);
    return {
      overview: {
        noteCount: summary.count,
        totalImpressions: summary.impressions,
        totalViews: summary.views,
        totalLikes: summary.likes,
        totalCollects: summary.collects,
        totalComments: summary.comments,
        totalShares: summary.shares,
        totalFollowers: summary.followers,
        totalLikeCollect: summary.likeCollect,
        totalInteractions: summary.interactions,
        averageCoverCtr: roundMetric(average(rows, "coverCtr")),
        averageLikeCollectRate: roundMetric(average(rows, "likeCollectRate")),
        averageCollectRate: roundMetric(average(rows, "collectRate"))
      },
      statusDistribution: statusDistributionToList(distribution.statuses, distribution.counts),
      accountSummary: plainAccountSummary(summary),
      keyWorks: {
        topViews: serializeSingleAiRows(topRowsBy(rows, "views", 5)),
        topLikeCollect: serializeSingleAiRows(topRowsBy(rows, "likeCollect", 5)),
        topCollectRate: serializeSingleAiRows(topRowsBy(rows.filter(function (row) {
          return row.views > 0;
        }), "collectRate", 5)),
        hotWorks: serializeSingleAiRows(rows.filter(function (row) {
          return row.status === "爆款";
        }).slice(0, 10)),
        qualityLowTrafficWorks: serializeSingleAiRows(rows.filter(function (row) {
          return row.status === "优质低流量";
        }).slice(0, 10)),
        suspectedTailWorks: serializeSingleAiRows(rows.filter(function (row) {
          return row.status === "疑似尾流";
        }).slice(0, 10)),
        failedWorks: serializeSingleAiRows(rows.filter(function (row) {
          return row.status === "失败" || row.status === "冷启动失败";
        }).slice(0, 10))
      }
    };
  }

  function buildMultiSnapshotAiSummary(rows, context) {
    var totals = buildCompareTotals(rows);
    var counts = countCompareStatuses(rows);
    var statuses = Object.keys(counts).sort(compareGrowthStatusOrder);
    return {
      overview: {
        snapshotCount: context.snapshotCount,
        intervalCount: context.intervalCount,
        earliestObservationTime: formatDisplayDate(context.startDate.getTime()),
        latestObservationTime: formatDisplayDate(context.endDate.getTime()),
        totalHours: roundMetric(context.totalHours)
      },
      totalGrowth: plainCompareTotals(totals),
      intervalGrowth: buildAiIntervalSummaries(rows, context),
      growthDistribution: statusDistributionToList(statuses, counts),
      keyWorks: {
        obviousGrowthWorks: serializeCompareAiRows(rows.filter(function (row) {
          return row.growthStatus === "明显放量";
        }).slice(0, 12)),
        stableGrowthWorks: serializeCompareAiRows(rows.filter(function (row) {
          return row.growthStatus === "稳定增长";
        }).slice(0, 12)),
        suspectedTailWorks: serializeCompareAiRows(rows.filter(function (row) {
          return row.growthStatus === "疑似尾流";
        }).slice(0, 12)),
        stalledWorks: serializeCompareAiRows(rows.filter(function (row) {
          return row.growthStatus === "基本停滞";
        }).slice(0, 12)),
        topDeltaViews: serializeCompareAiRows(topRowsBy(rows, "deltaViews", 8)),
        topDeltaLikeCollect: serializeCompareAiRows(topRowsBy(rows, "deltaLikeCollect", 8)),
        topDeltaCollects: serializeCompareAiRows(topRowsBy(rows, "deltaCollects", 8))
      }
    };
  }

  function buildAiIntervalSummaries(rows, context) {
    return context.snapshots.slice(0, -1).map(function (snapshot, index) {
      var nextSnapshot = context.snapshots[index + 1];
      var intervalKey = "interval-" + index;
      var intervalRows = rows.filter(function (row) {
        return row.intervalKey === intervalKey;
      });
      var totals = buildCompareTotals(intervalRows);
      var counts = countCompareStatuses(intervalRows);
      return {
        intervalKey: intervalKey,
        intervalLabel: formatDisplayDate(snapshot.date.getTime()) + " -> " + formatDisplayDate(nextSnapshot.date.getTime()),
        intervalHours: intervalRows[0] ? roundMetric(intervalRows[0].intervalHours) : 0,
        noteCount: intervalRows.length,
        totals: plainCompareTotals(totals),
        growthDistribution: statusDistributionToList(Object.keys(counts).sort(compareGrowthStatusOrder), counts)
      };
    });
  }

  function plainAccountSummary(summary) {
    return {
      noteCount: summary.count,
      totalImpressions: summary.impressions,
      totalViews: summary.views,
      totalLikes: summary.likes,
      totalCollects: summary.collects,
      totalComments: summary.comments,
      totalShares: summary.shares,
      totalFollowers: summary.followers,
      totalLikeCollect: summary.likeCollect,
      totalInteractions: summary.interactions,
      overallLikeCollectRate: roundMetric(summary.likeCollectRate),
      overallCollectRate: roundMetric(summary.collectRate),
      overallCommentRate: roundMetric(summary.commentRate),
      overallShareRate: roundMetric(summary.shareRate),
      overallFollowerRate: roundMetric(summary.followerRate),
      overallClickConversion: roundMetric(summary.clickConversion)
    };
  }

  function plainCompareTotals(totals) {
    return {
      matchedNoteCount: totals.matched,
      newNoteCount: totals.newCount,
      missingNoteCount: totals.missingCount,
      totalDeltaImpressions: totals.deltaImpressions,
      totalDeltaViews: totals.deltaViews,
      totalDeltaLikes: totals.deltaLikes,
      totalDeltaCollects: totals.deltaCollects,
      totalDeltaComments: totals.deltaComments,
      totalDeltaShares: totals.deltaShares,
      totalDeltaFollowers: totals.deltaFollowers,
      totalDeltaLikeCollect: totals.deltaLikeCollect,
      totalDeltaInteractions: totals.deltaInteractions
    };
  }

  function statusDistributionToList(statuses, counts) {
    return statuses.map(function (status) {
      return {
        status: status,
        count: counts[status] || 0
      };
    });
  }

  function serializeSingleAiRows(rows) {
    return rows.map(function (row) {
      return {
        topic: getFullDisplayName(row),
        originalTitle: row.title || row.originalTitle || "",
        firstPublishedAt: row.publishedText,
        impressions: row.impressions,
        views: row.views,
        likes: row.likes,
        collects: row.collects,
        comments: row.comments,
        shares: row.shares,
        followers: row.followers,
        likeCollect: row.likeCollect,
        interactions: row.interactions,
        coverCtr: roundMetric(row.coverCtr),
        likeCollectRate: roundMetric(row.likeCollectRate),
        collectRate: roundMetric(row.collectRate),
        ageHours: roundMetric(row.ageHours),
        status: row.status,
        advice: row.advice
      };
    });
  }

  function serializeCompareAiRows(rows) {
    return rows.map(function (row) {
      return {
        intervalLabel: row.intervalLabel,
        topic: getFullDisplayName(row),
        originalTitle: row.title || "",
        firstPublishedAt: row.publishedText,
        oldViews: row.oldViews,
        newViews: row.newViews,
        deltaViews: row.deltaViews,
        deltaImpressions: row.deltaImpressions,
        deltaLikes: row.deltaLikes,
        deltaCollects: row.deltaCollects,
        deltaComments: row.deltaComments,
        deltaShares: row.deltaShares,
        deltaFollowers: row.deltaFollowers,
        deltaLikeCollect: row.deltaLikeCollect,
        deltaInteractions: row.deltaInteractions,
        deltaViewsPerHour: roundMetric(row.deltaViewsPerHour),
        deltaLikeCollectPerHour: roundMetric(row.deltaLikeCollectPerHour),
        growthStatus: row.growthStatus,
        growthAdvice: row.growthAdvice,
        matchRisk: !!row.matchRisk,
        hasNegativeDelta: !!row.hasNegativeDelta
      };
    });
  }

  function getFullDisplayName(row) {
    var topic = String(row.topic || "").trim();
    if (topic && topic !== "待填写") {
      return topic;
    }
    return String(row.title || row.originalTitle || "未命名笔记").trim();
  }

  function roundMetric(value) {
    var number = Number(value) || 0;
    return Math.round(number * 10000) / 10000;
  }

  function buildSingleOperationJudgement(data) {
    var judgements = [];
    if (data.hotCount > 0) {
      judgements.push("本次有 " + formatInteger(data.hotCount) + " 条爆款作品，说明部分选题和表达已经跑出较强反馈，建议重点复盘菜品、封面、标题结构和发布时间。");
    }
    if (data.tailCount >= 3 || data.tailCount / data.total >= 0.2) {
      judgements.push("疑似尾流作品占比偏高，部分作品可能进入低速阶段，但尾流结论仍需结合多次快照确认。");
    }
    if (data.lowQualityCount > 0) {
      judgements.push("存在优质低流量作品，内容反馈不差但分发不足，可以考虑换标题、换封面或换发布时间二发。");
    }
    if (data.failCount >= 3 || data.failCount / data.total >= 0.2) {
      judgements.push("失败或冷启动失败作品偏多，低反馈选题暂不建议优先复用。");
    }
    if (data.normalCount / data.total >= 0.5) {
      judgements.push("普通类作品占比较高，整体表现相对平稳，但当前缺少明显放量点。");
    }
    if (!judgements.length) {
      judgements.push("当前数据整体没有特别极端的信号，建议继续结合新增数据和后续快照观察。");
    }
    return judgements.join("\n");
  }

  function buildSingleNextActions(data) {
    var actions = [];
    if (data.hotCount > 0) {
      actions.push("1. 重点复盘爆款作品的选题、封面和标题结构。");
    } else {
      actions.push("1. 继续寻找更明确的放量选题，优先观察观看和赞藏同步提升的作品。");
    }
    actions.push("2. 优先观察赞藏率高、收藏率高的作品，判断是否具备二发或系列化价值。");
    if (data.lowQualityCount > 0) {
      actions.push("3. 对低流量但高赞藏率作品，可以尝试换封面或换标题二发。");
    } else {
      actions.push("3. 对普通作品先做轻量复盘，不急于大规模扩展同类选题。");
    }
    if (data.failCount > 0) {
      actions.push("4. 对失败作品暂不扩展同类选题，先保留样本观察原因。");
    }
    actions.push((actions.length + 1) + ". 真正尾流判断建议结合多次快照对比，不要只凭单次快照下结论。");
    return actions.slice(0, 5);
  }

  function buildIntervalRecapLines(rows, context) {
    return context.snapshots.slice(0, -1).map(function (snapshot, index) {
      var nextSnapshot = context.snapshots[index + 1];
      var intervalKey = "interval-" + index;
      var intervalRows = rows.filter(function (row) {
        return row.intervalKey === intervalKey;
      });
      var totals = buildCompareTotals(intervalRows);
      var counts = countCompareStatuses(intervalRows);
      return formatDisplayDate(snapshot.date.getTime()) + " -> " + formatDisplayDate(nextSnapshot.date.getTime()) +
        "：新增观看 " + formatSignedInteger(totals.deltaViews) +
        "，新增赞藏和 " + formatSignedInteger(totals.deltaLikeCollect) +
        "，明显放量 " + formatInteger(counts["明显放量"] || 0) +
        " 条，稳定增长 " + formatInteger(counts["稳定增长"] || 0) +
        " 条，疑似尾流 " + formatInteger(counts["疑似尾流"] || 0) +
        " 条，基本停滞 " + formatInteger(counts["基本停滞"] || 0) + " 条。";
    });
  }

  function buildCompareOperationJudgement(data) {
    var judgements = [];
    if (data.obviousCount > 0) {
      judgements.push("本次有 " + formatInteger(data.obviousCount) + " 条明显放量记录，这些作品当前增长较强，建议重点观察，不要频繁干扰。");
    }
    if (data.stableCount >= 3) {
      judgements.push("稳定增长记录较多，说明账号仍有持续流量进入，可以继续观察后续区间表现。");
    }
    if (data.tailCount + data.stalledCount >= 3) {
      judgements.push("疑似尾流或基本停滞记录偏多，部分作品可能进入低速阶段，但真正尾流需要连续多个区间确认。");
    }
    if (data.repeatedLow.length) {
      judgements.push("有作品连续多个区间新增较低，例如：" + data.repeatedLow.slice(0, 3).map(function (item) { return item.name; }).join("、") + "，这些作品更接近需要降级关注。");
    }
    if (data.reboundRows.length) {
      judgements.push("有作品出现前一区间低增长、后一区间增长转强的迹象，例如：" + data.reboundRows.slice(0, 3).map(function (item) { return item.name; }).join("、") + "，可能出现二次推荐或重新放量。");
    }
    if (!judgements.length) {
      judgements.push("当前多快照增长没有特别极端的信号，建议继续积累更多区间后再判断趋势。");
    }
    return judgements.join("\n");
  }

  function buildCompareNextActions(data) {
    var actions = [];
    if (data.obviousCount > 0) {
      actions.push("1. 优先保护明显放量作品，短时间内不要频繁发布干扰。");
    } else {
      actions.push("1. 继续观察是否有作品在后续区间进入明显放量。");
    }
    if (data.stableCount > 0) {
      actions.push("2. 对稳定增长作品继续观察，不急于判断尾流。");
    }
    if (data.tailCount + data.stalledCount > 0) {
      actions.push((actions.length + 1) + ". 对连续低增长作品可暂时降级关注，但尾流仍需结合连续快照确认。");
    }
    actions.push((actions.length + 1) + ". 对新增收藏高的作品优先复盘选题、封面和标题。");
    if (safeDivide(data.totalDeltaViews, data.totalHours) < 100) {
      actions.push((actions.length + 1) + ". 如果整体新增观看持续下降，建议放缓发布节奏，观察已有作品尾段表现。");
    } else {
      actions.push((actions.length + 1) + ". 如果整体新增观看仍强，可以谨慎发布新作品，同时关注是否影响正在增长的作品。");
    }
    return actions.slice(0, 6);
  }

  function topRowsBy(rows, key, limit) {
    return rows.slice().sort(function (a, b) {
      return (Number(b[key]) || 0) - (Number(a[key]) || 0);
    }).slice(0, limit);
  }

  function formatStatusDistributionSentence(statuses, counts, prefix) {
    if (!statuses.length) {
      return prefix + "暂无状态数据";
    }
    return prefix + "，" + statuses.map(function (status) {
      return status + " " + formatInteger(counts[status]) + " 条";
    }).join("，");
  }

  function formatSingleRowList(rows, formatter) {
    if (!rows.length) {
      return "暂无。";
    }
    return rows.map(function (row) {
      return getDisplayName(row) + "（" + formatter(row) + "）";
    }).join("；") + "。";
  }

  function formatCompareRowList(rows, metricKey) {
    if (!rows.length) {
      return "暂无。";
    }
    return rows.map(function (row) {
      return getDisplayName(row) + "｜" + row.intervalLabel + "（新增观看 " +
        formatSignedInteger(row.deltaViews) + "，新增赞藏和 " +
        formatSignedInteger(row.deltaLikeCollect) + "，每小时观看 " +
        formatNumber(row.deltaViewsPerHour, 1) + "，" + row.growthStatus + "）";
    }).join("；") + "。";
  }

  function getDisplayName(row) {
    var topic = String(row.topic || "").trim();
    if (topic && topic !== "待填写") {
      return truncateText(topic, 18);
    }
    return truncateText(String(row.title || row.originalTitle || "未命名笔记").trim(), 18);
  }

  function truncateText(text, maxLength) {
    var value = String(text || "");
    if (value.length <= maxLength) {
      return value;
    }
    return value.slice(0, maxLength - 1) + "…";
  }

  function findRepeatedLowGrowthRows(rows) {
    var grouped = groupCompareRowsBySnapshot(rows);
    return Object.keys(grouped).map(function (key) {
      var lowRows = grouped[key].filter(isLowGrowthCompareRow);
      if (lowRows.length >= 2) {
        return {
          name: getDisplayName(lowRows[0]),
          count: lowRows.length
        };
      }
      return null;
    }).filter(Boolean);
  }

  function findReboundRows(rows) {
    var grouped = groupCompareRowsBySnapshot(rows);
    var result = [];
    Object.keys(grouped).forEach(function (key) {
      var sorted = grouped[key].slice().sort(function (a, b) {
        return a.intervalIndex - b.intervalIndex;
      });
      for (var i = 1; i < sorted.length; i += 1) {
        if (isLowGrowthCompareRow(sorted[i - 1]) && (sorted[i].growthStatus === "明显放量" || sorted[i].growthStatus === "稳定增长")) {
          result.push({
            name: getDisplayName(sorted[i]),
            intervalLabel: sorted[i].intervalLabel
          });
          break;
        }
      }
    });
    return result;
  }

  function groupCompareRowsBySnapshot(rows) {
    return rows.reduce(function (result, row) {
      var key = row.snapshotKey || row.title + "__" + row.publishedText;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(row);
      return result;
    }, {});
  }

  function isLowGrowthCompareRow(row) {
    return row.growthStatus === "基本停滞" ||
      row.growthStatus === "疑似尾流" ||
      (row.deltaViews < 20 && row.deltaLikeCollect < 2);
  }

  function buildAccountSummary(rows) {
    var summary = rows.reduce(function (total, row) {
      total.count += 1;
      total.impressions += Number(row.impressions) || 0;
      total.views += Number(row.views) || 0;
      total.likes += Number(row.likes) || 0;
      total.collects += Number(row.collects) || 0;
      total.comments += Number(row.comments) || 0;
      total.shares += Number(row.shares) || 0;
      total.followers += Number(row.followers) || 0;
      total.danmaku += Number(row.danmaku) || 0;
      total.likeCollect += Number(row.likeCollect) || 0;
      total.interactions += Number(row.interactions) || 0;
      return total;
    }, {
      count: 0,
      impressions: 0,
      views: 0,
      likes: 0,
      collects: 0,
      comments: 0,
      shares: 0,
      followers: 0,
      danmaku: 0,
      likeCollect: 0,
      interactions: 0
    });

    summary.likeCollectRate = safeDivide(summary.likeCollect, summary.views);
    summary.collectRate = safeDivide(summary.collects, summary.views);
    summary.commentRate = safeDivide(summary.comments, summary.views);
    summary.shareRate = safeDivide(summary.shares, summary.views);
    summary.followerRate = safeDivide(summary.followers, summary.views);
    summary.clickConversion = safeDivide(summary.views, summary.impressions);
    return summary;
  }

  function renderSummaryGrid(container, summary) {
    if (!container) {
      return;
    }
    var items = [
      ["笔记数", formatInteger(summary.count)],
      ["总曝光", formatInteger(summary.impressions)],
      ["总观看量", formatInteger(summary.views)],
      ["总点赞", formatInteger(summary.likes)],
      ["总收藏", formatInteger(summary.collects)],
      ["总评论", formatInteger(summary.comments)],
      ["总分享", formatInteger(summary.shares)],
      ["总涨粉", formatInteger(summary.followers)],
      ["总赞藏和", formatInteger(summary.likeCollect)],
      ["总互动量", formatInteger(summary.interactions)],
      ["整体赞藏率", formatPercent(summary.likeCollectRate)],
      ["整体收藏率", formatPercent(summary.collectRate)],
      ["整体评论率", formatPercent(summary.commentRate)],
      ["整体分享率", formatPercent(summary.shareRate)],
      ["整体涨粉率", formatPercent(summary.followerRate)],
      ["整体点击转化", formatPercent(summary.clickConversion)]
    ];

    container.innerHTML = items.map(function (item) {
      return "<div class=\"summary-item\"><span data-tooltip=\"" + escapeHtml(getMetricTooltip(item[0])) + "\">" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></div>";
    }).join("");
  }

  function renderSummaryRow(summary) {
    return [
      "<tr class=\"summary-row\">",
      "<td>合计</td>",
      "<td>—</td>",
      "<td>—</td>",
      "<td>—</td>",
      "<td>" + formatInteger(summary.impressions) + "</td>",
      "<td>" + formatInteger(summary.views) + "</td>",
      "<td>" + formatPercent(summary.clickConversion) + "</td>",
      "<td>" + formatInteger(summary.likes) + "</td>",
      "<td>" + formatInteger(summary.comments) + "</td>",
      "<td>" + formatInteger(summary.collects) + "</td>",
      "<td>" + formatInteger(summary.followers) + "</td>",
      "<td>" + formatInteger(summary.shares) + "</td>",
      "<td>—</td>",
      "<td>" + formatInteger(summary.danmaku) + "</td>",
      "<td>" + formatInteger(summary.likeCollect) + "</td>",
      "<td>" + formatInteger(summary.interactions) + "</td>",
      "<td>" + formatPercent(summary.likeCollectRate) + "</td>",
      "<td>" + formatPercent(summary.collectRate) + "</td>",
      "<td>" + formatPercent(summary.commentRate) + "</td>",
      "<td>" + formatPercent(summary.shareRate) + "</td>",
      "<td>" + formatPercent(summary.followerRate) + "</td>",
      "<td>—</td>",
      "<td>—</td>",
      "<td>—</td>",
      "<td>—</td>",
      "</tr>"
    ].join("");
  }

  function clearOverview() {
    [
      "totalCount",
      "overviewImpressions",
      "overviewViews",
      "overviewLikes",
      "overviewCollects",
      "overviewLikeCollect"
    ].forEach(function (id) {
      setText(id, "0");
    });
    setText("avgCtr", "0%");
    setText("avgLikeCollectRate", "0%");
    setText("avgCollectRate", "0%");
    renderStatusDistribution([]);
    updateAccountSummaries([], []);
  }

  function average(rows, key) {
    if (!rows.length) {
      return 0;
    }
    var sum = rows.reduce(function (total, row) {
      return total + (Number(row[key]) || 0);
    }, 0);
    return sum / rows.length;
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function renderEmpty(message) {
    resultBody.innerHTML = "<tr><td colspan=\"25\" class=\"empty-cell\">" + escapeHtml(message) + "</td></tr>";
  }

  function showMessage(message, ok) {
    messageBox.textContent = message;
    messageBox.className = "message-box show" + (ok ? " ok" : "");
  }

  function parseNumber(value) {
    if (value === null || typeof value === "undefined") {
      return 0;
    }
    var text = String(value).trim();
    if (!text) {
      return 0;
    }
    text = text.replace(/,/g, "").replace(/\s/g, "");
    text = text.replace(/[^\d.-]/g, "");
    var number = Number(text);
    return Number.isFinite(number) ? number : 0;
  }

  function parsePercent(value) {
    if (value === null || typeof value === "undefined") {
      return 0;
    }
    var text = String(value).trim();
    if (!text) {
      return 0;
    }
    var hasPercent = text.indexOf("%") !== -1;
    var number = parseNumber(text);
    if (!Number.isFinite(number)) {
      return 0;
    }
    return hasPercent ? number / 100 : number;
  }

  function safeDivide(numerator, denominator) {
    if (!denominator || denominator <= 0) {
      return 0;
    }
    return numerator / denominator;
  }

  function extractTopicFromTitle(title) {
    var originalTitle = String(title || "").trim();
    if (!originalTitle) {
      return {
        topic: "待填写",
        confidence: "需手填"
      };
    }

    var cleanedTitle = normalizeTopicTitle(originalTitle);
    var fullDishNames = [
      "照烧荷包蛋盖饭",
      "椒盐玉米排骨",
      "肉末茄子盖饭",
      "鸡蛋酱拌面",
      "土豆炖牛腩",
      "干锅土豆片",
      "东北锅包肉",
      "蒜苗回锅肉",
      "荷包蛋盖饭",
      "玉米排骨汤",
      "酱香排骨",
      "糖醋排骨",
      "红烧排骨",
      "蒜香排骨",
      "可乐鸡翅",
      "蜜汁鸡翅",
      "蒜香鸡翅",
      "鱼香肉丝",
      "宫保鸡丁",
      "麻婆豆腐",
      "糖醋里脊",
      "水煮肉片",
      "小炒黄牛肉",
      "干锅花菜",
      "椒盐玉米排骨",
      "辣椒炒肉",
      "蒜蓉生菜",
      "酸菜炖排骨",
      "白菜粉条",
      "白菜豆腐",
      "梅菜扣肉",
      "香辣鸡翅",
      "蒜蓉虾",
      "土豆炖牛肉",
      "萝卜牛腩",
      "肉末茄子",
      "鸡蛋酱面",
      "黄焖鸡",
      "水煮鱼",
      "酸菜鱼",
      "锅包肉",
      "回锅肉",
      "卤鸡爪",
      "酱猪蹄",
      "清蒸鱼"
    ].sort(function (a, b) {
      return b.length - a.length;
    });
    var matchedFullDish = findKeyword(cleanedTitle, fullDishNames);
    if (matchedFullDish) {
      return {
        topic: matchedFullDish,
        confidence: "自动识别"
      };
    }

    var matchedPhrase = findStructuredDishPhrase(cleanedTitle);
    if (matchedPhrase) {
      return {
        topic: matchedPhrase,
        confidence: "自动识别"
      };
    }

    var ingredients = [
      "鸡翅",
      "排骨",
      "鸡腿",
      "鸡爪",
      "牛肉",
      "猪蹄",
      "茄子",
      "豆腐",
      "生菜",
      "土豆",
      "白菜",
      "粉条",
      "鸡蛋",
      "荷包蛋",
      "玉米",
      "虾",
      "鱼",
      "炒肉",
      "汤",
      "煲",
      "炖",
      "蒸",
      "炒",
      "焖",
      "拌",
      "卤",
      "酱"
    ];
    var matchedIngredient = findKeyword(cleanedTitle, ingredients);
    if (matchedIngredient) {
      return {
        topic: matchedIngredient,
        confidence: "疑似"
      };
    }

    return {
      topic: "待填写",
      confidence: "需手填"
    };
  }

  function normalizeTopicTitle(title) {
    return removeTopicPrefixes(removeMarketingWords(title))
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
      .replace(/[!！?？,，.。:：;；、~～|#【】\[\]（）()“”"']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function removeMarketingWords(title) {
    var words = [
      "新手也能做",
      "家常又好吃",
      "太香了",
      "真的下饭",
      "5分钟搞定",
      "外香里嫩",
      "甜咸刚刚好",
      "好吃到停不下来",
      "怎么会有这么香",
      "这样做",
      "家常版",
      "家庭版",
      "简单版",
      "懒人版",
      "低脂版",
      "空气炸锅版",
      "在家复刻",
      "教你做",
      "来，教你做",
      "谁懂",
      "这碗",
      "这个",
      "这道",
      "真的",
      "哇",
      "跟学",
      "Share",
      "colorDrink"
    ];
    var text = title;
    words.forEach(function (word) {
      text = text.replace(new RegExp(word, "gi"), "");
    });
    return text;
  }

  function removeTopicPrefixes(text) {
    return text
      .replace(/^(来\s*)?[，,、\s]*(教你做)[:：\s]*/g, "")
      .replace(/^(家常版|家庭版|简单版|懒人版|低脂版|空气炸锅版|在家复刻|跟学|谁懂|这碗|这个|这道|真的|哇)+/g, "")
      .replace(/^(这碗|这个|这道|这)/g, "")
      .trim();
  }

  function findKeyword(text, keywords) {
    for (var i = 0; i < keywords.length; i += 1) {
      if (text.indexOf(keywords[i]) !== -1) {
        return keywords[i];
      }
    }
    return "";
  }

  function findStructuredDishPhrase(text) {
    var parts = text.split(/\s+/).filter(Boolean);
    var suffixes = "(盖饭|拌面|汤|煲|炒饭|炒面|炖菜|焖饭)";
    var methods = "(炒肉|排骨|鸡翅|鸡腿|鸡爪|牛肉|猪蹄|茄子|豆腐|生菜|土豆|玉米|白菜|粉条|鸡蛋|荷包蛋|虾|鱼|汤|煲|炖|蒸|炒|焖|拌|卤|酱)";
    var patterns = [
      new RegExp("[\\u4e00-\\u9fa5]{2,8}" + suffixes, "g"),
      new RegExp("[\\u4e00-\\u9fa5]{1,6}" + methods + suffixes + "?", "g")
    ];

    for (var i = 0; i < parts.length; i += 1) {
      for (var j = 0; j < patterns.length; j += 1) {
        var matches = parts[i].match(patterns[j]);
        if (matches && matches.length) {
          return trimDishPhrase(matches[0]);
        }
      }
    }
    return "";
  }

  function trimDishPhrase(phrase) {
    return phrase
      .replace(/^(做|吃|学|教你|家庭|家常|空气炸锅|低脂|低卡|这碗|这个|这道|这)/, "")
      .trim();
  }

  function isSingleIngredient(topic) {
    return ["鸡翅", "排骨", "鸡腿", "鸡爪", "牛肉", "猪蹄", "茄子", "豆腐", "生菜", "土豆", "玉米", "虾", "鱼"].indexOf(topic) !== -1;
  }

  function buildTopicStorageKey(publishedText, title, index, views, likes, collects, publishedAt, emptyTitlePublishCounts) {
    var cleanTitle = normalizeOriginalTitle(title);
    if (cleanTitle) {
      return "xhs-topic::" + String(publishedText || "").trim() + "::" + cleanTitle;
    }
    return "xhs-topic::" + buildEmptyTitleNoteKey(publishedText, publishedAt, index, views, likes, collects, emptyTitlePublishCounts);
  }

  function buildNoteKey(originalTitle, publishedAt, index, views, likes, collects, emptyTitlePublishCounts) {
    var cleanTitle = normalizeOriginalTitle(originalTitle);
    if (cleanTitle) {
      return cleanTitle;
    }
    return buildEmptyTitleNoteKey("", publishedAt, index, views, likes, collects, emptyTitlePublishCounts);
  }

  function buildEmptyTitleNoteKey(publishedText, publishedAt, index, views, likes, collects, emptyTitlePublishCounts) {
    var timeKey = getEmptyTitleTimeKey(publishedText, publishedAt);
    var baseKey = "EMPTY_TITLE__" + timeKey;
    if (shouldUseSecondaryEmptyTitleKey(timeKey, emptyTitlePublishCounts)) {
      return baseKey + "__row-" + (Number(index) || 0);
    }
    return baseKey;
  }

  function getEmptyTitleTimeKey(publishedText, publishedAt) {
    return formatSnapshotTime(publishedAt) || String(publishedText || "").trim();
  }

  function shouldUseSecondaryEmptyTitleKey(timeKey, emptyTitlePublishCounts) {
    return !!(timeKey && emptyTitlePublishCounts && emptyTitlePublishCounts[timeKey] > 1);
  }

  function buildEmptyTitlePublishCounts(rows) {
    var counts = {};
    (rows || []).forEach(function (row) {
      if (normalizeOriginalTitle(row["笔记标题"])) {
        return;
      }
      var publishedDate = parseLocalDate(row["首次发布时间"]);
      if (!publishedDate) {
        return;
      }
      var timeKey = formatSnapshotTime(publishedDate.getTime());
      counts[timeKey] = (counts[timeKey] || 0) + 1;
    });
    return counts;
  }

  function buildCorrectionKey(originalTitle, noteKey) {
    var cleanTitle = normalizeOriginalTitle(originalTitle);
    if (cleanTitle) {
      return "xhs-topic-correction::" + cleanTitle;
    }
    return "xhs-topic-correction::" + String(noteKey || "EMPTY_TITLE");
  }

  function normalizeOriginalTitle(originalTitle) {
    return String(originalTitle || "").trim().replace(/\s+/g, " ");
  }

  function getSavedTopic(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return "";
    }
  }

  function getTopicCorrection(originalTitle, noteKey, firstPublishTime) {
    if (!normalizeOriginalTitle(originalTitle)) {
      migrateLegacyEmptyTitleCorrection(noteKey, firstPublishTime);
    }
    var key = buildCorrectionKey(originalTitle, noteKey);
    var saved = getSavedTopic(key);
    if (!saved) {
      return null;
    }

    try {
      var parsed = JSON.parse(saved);
      if (
        parsed &&
        parsed.source === "manual" &&
        parsed.topic &&
        parsed.topic !== "待填写"
      ) {
        return parsed;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function saveTopicCorrection(originalTitle, topic, noteKey, firstPublishTime) {
    var cleanTitle = normalizeOriginalTitle(originalTitle);
    var cleanTopic = String(topic || "").trim();
    var cleanNoteKey = String(noteKey || "").trim();
    if ((!cleanTitle && !cleanNoteKey) || !cleanTopic || cleanTopic === "待填写") {
      return;
    }

    try {
      var emptyTitleTime = cleanTitle ? "" : (firstPublishTime || extractEmptyTitleFirstPublishTime(cleanNoteKey));
      localStorage.setItem(buildCorrectionKey(cleanTitle, cleanNoteKey), JSON.stringify({
        key: cleanTitle || cleanNoteKey,
        originalTitle: cleanTitle,
        firstPublishTime: emptyTitleTime,
        noteKey: cleanNoteKey || cleanTitle,
        topic: cleanTopic,
        source: "manual",
        updatedAt: new Date().toISOString(),
        isEmptyTitle: !cleanTitle
      }));
    } catch (error) {
      showMessage("浏览器没有允许保存选题修正库，本次修改只会保留在当前页面。", false);
    }
  }

  function migrateLegacyEmptyTitleCorrection(noteKey, firstPublishTime) {
    var targetTime = firstPublishTime || extractEmptyTitleFirstPublishTime(noteKey);
    if (!targetTime) {
      return;
    }

    var targetKey = buildCorrectionKey("", noteKey);
    var targetRecord = parseManualTopicCorrection(getSavedTopic(targetKey));
    var bestRecord = targetRecord;
    var legacyKeysToRemove = [];

    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (!key || key === targetKey || !isTopicStorageKey(key)) {
          continue;
        }

        var parsed = parseManualTopicCorrection(localStorage.getItem(key));
        if (!parsed || !isEmptyTitleCorrectionRecord(parsed, key)) {
          continue;
        }

        var recordTime = getCorrectionFirstPublishTime(parsed, key);
        if (!recordTime) {
          continue;
        }
        if (recordTime !== targetTime) {
          continue;
        }
        if (isSecondaryEmptyTitleKey(noteKey) && !hasSameSecondaryEmptyTitleSuffix(noteKey, parsed.noteKey || key)) {
          continue;
        }

        if (!bestRecord || isCorrectionNewer(parsed, bestRecord)) {
          bestRecord = parsed;
        }
        legacyKeysToRemove.push(key);
      }

      if (bestRecord && (!targetRecord || isCorrectionNewer(bestRecord, targetRecord))) {
        localStorage.setItem(targetKey, JSON.stringify({
          key: noteKey,
          originalTitle: "",
          firstPublishTime: targetTime,
          noteKey: noteKey,
          topic: bestRecord.topic,
          source: "manual",
          updatedAt: bestRecord.updatedAt || new Date().toISOString(),
          isEmptyTitle: true
        }));
      }

      legacyKeysToRemove.forEach(function (key) {
        localStorage.removeItem(key);
      });
    } catch (error) {
      return;
    }
  }

  function parseManualTopicCorrection(value) {
    if (!value) {
      return null;
    }
    try {
      var parsed = JSON.parse(value);
      if (
        parsed &&
        parsed.source === "manual" &&
        parsed.topic &&
        parsed.topic !== "待填写"
      ) {
        return parsed;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function isEmptyTitleCorrectionRecord(record, key) {
    return !!(
      record &&
      (!normalizeOriginalTitle(record.originalTitle) || record.isEmptyTitle || String(record.noteKey || "").indexOf("EMPTY_TITLE") !== -1 || String(key || "").indexOf("EMPTY_TITLE") !== -1)
    );
  }

  function getCorrectionFirstPublishTime(record, key) {
    return String(record.firstPublishTime || "").trim() ||
      extractEmptyTitleFirstPublishTime(record.noteKey) ||
      extractEmptyTitleFirstPublishTime(record.key) ||
      extractEmptyTitleFirstPublishTime(key);
  }

  function extractEmptyTitleFirstPublishTime(value) {
    var text = String(value || "");
    var match = text.match(/EMPTY_TITLE_+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    return match ? match[1] : "";
  }

  function isCorrectionNewer(candidate, current) {
    return String(candidate.updatedAt || "").localeCompare(String(current.updatedAt || "")) > 0;
  }

  function isSecondaryEmptyTitleKey(value) {
    return /__row-\d+/.test(String(value || ""));
  }

  function hasSameSecondaryEmptyTitleSuffix(a, b) {
    var left = String(a || "").match(/__row-\d+/);
    var right = String(b || "").match(/__row-\d+/);
    return !!(left && right && left[0] === right[0]);
  }

  function getAllTopicCorrections() {
    var corrections = [];
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (key.indexOf("xhs-topic-correction::") !== 0) {
          continue;
        }
        var parsed = JSON.parse(localStorage.getItem(key));
        if (
          parsed &&
          parsed.source === "manual" &&
          parsed.topic &&
          parsed.topic !== "待填写" &&
          (normalizeOriginalTitle(parsed.originalTitle) || isEmptyTitleCorrectionRecord(parsed, key))
        ) {
          corrections.push(parsed);
        }
      }
    } catch (error) {
      return corrections;
    }
    return corrections.sort(function (a, b) {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
  }

  function getSavedManualTopic(key, autoTopic) {
    var saved = getSavedTopic(key);
    if (!saved) {
      return null;
    }

    try {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.source === "manual" && parsed.topic && parsed.topic !== "待填写") {
        return parsed;
      }
      return null;
    } catch (error) {
      if (saved === "待填写" || saved === autoTopic.topic) {
        return null;
      }
      return null;
    }
  }

  function saveManualTopic(key, topic, confidence) {
    try {
      localStorage.setItem(key, JSON.stringify({
        topic: topic,
        source: "manual",
        confidence: confidence
      }));
    } catch (error) {
      showMessage("浏览器没有允许保存手动选题，本次修改只会保留在当前页面。", false);
    }
  }

  function isTopicStorageKey(key) {
    return key && (key.indexOf("xhs-topic::") === 0 || key.indexOf("xhs-topic-correction::") === 0);
  }

  function isPendingTopicCache(value) {
    if (!value) {
      return false;
    }
    if (value === "待填写") {
      return true;
    }
    try {
      var parsed = JSON.parse(value);
      return parsed && parsed.topic === "待填写" && parsed.source !== "manual";
    } catch (error) {
      return false;
    }
  }

  function removeSavedTopic(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      return;
    }
  }

  function topicCellClass(confidence) {
    if (confidence === "需手填") {
      return "topic-need";
    }
    if (confidence === "疑似") {
      return "topic-suspect";
    }
    if (confidence === "手动") {
      return "topic-saved";
    }
    if (confidence === "历史修正") {
      return "topic-history";
    }
    if (confidence === "已导入") {
      return "topic-imported";
    }
    return "";
  }

  function parseLocalDate(value) {
    if (!value) {
      return null;
    }

    var text = String(value).trim();
    text = text
      .replace(/年/g, "-")
      .replace(/月/g, "-")
      .replace(/日/g, " ")
      .replace(/时/g, ":")
      .replace(/分/g, ":")
      .replace(/秒/g, "")
      .replace(/\s+/g, " ")
      .trim();

    var match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+|T)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (!match) {
      return null;
    }

    var year = Number(match[1]);
    var month = Number(match[2]) - 1;
    var day = Number(match[3]);
    var hour = Number(match[4]);
    var minute = Number(match[5]);
    var second = Number(match[6] || 0);
    var date = new Date(year, month, day, hour, minute, second);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }

    return date;
  }

  function formatInteger(value) {
    return Math.round(Number(value) || 0).toLocaleString("zh-CN");
  }

  function formatSignedInteger(value) {
    var number = Math.round(Number(value) || 0);
    if (number > 0) {
      return "+" + number.toLocaleString("zh-CN");
    }
    return number.toLocaleString("zh-CN");
  }

  function formatNumber(value, digits) {
    return (Number(value) || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatDisplayDate(timestamp) {
    var date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) {
      return "";
    }
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate())
    ].join("-") + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatFileDate(date) {
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate())
    ].join("-");
  }

  function formatDuration(hours) {
    var safeHours = Math.max(0, Number(hours) || 0);
    if (safeHours < 1) {
      return Math.round(safeHours * 60) + "分钟";
    }
    if (safeHours < 24) {
      return safeHours.toFixed(1) + "小时";
    }
    return Math.floor(safeHours / 24) + "天" + Math.floor(safeHours % 24) + "小时";
  }

  function formatPercent(value) {
    return ((Number(value) || 0) * 100).toFixed(2) + "%";
  }

  function statusClass(status) {
    if (status === "爆款") {
      return "status-hit";
    }
    if (status === "爆款潜力") {
      return "status-potential";
    }
    if (["放量中", "优质观察", "优质", "优质长尾"].indexOf(status) !== -1) {
      return "status-quality";
    }
    if (status === "优质低流量") {
      return "status-lowquality";
    }
    if (["初始流量偏弱", "初始曝光不足", "冷启动失败", "冷启动偏弱", "失败", "普通偏弱"].indexOf(status) !== -1) {
      return "status-fail";
    }
    if (status === "疑似尾流") {
      return "status-tail";
    }
    if (["初始流量较好", "初始曝光正常", "普通观察", "普通", "低流量普通", "点击有了但互动弱"].indexOf(status) !== -1) {
      return "status-normal";
    }
    return "";
  }

  function compareStatusClass(status) {
    if (status === "明显放量") {
      return "status-hit";
    }
    if (status === "稳定增长") {
      return "status-quality";
    }
    if (status === "疑似尾流") {
      return "status-tail";
    }
    if (status === "基本停滞" || status === "快照缺失") {
      return "status-fail";
    }
    return "status-normal";
  }

  function getDeltaTooltip(row) {
    return row.hasNegativeDelta ? "数据回退，可能是平台统计修正或 CSV 不一致。" : "";
  }

  function escapeHtml(value) {
    return String(value === null || typeof value === "undefined" ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function csvCell(value) {
    var text = String(value === null || typeof value === "undefined" ? "" : value);
    return "\"" + text.replace(/"/g, "\"\"") + "\"";
  }

  function downloadCsv(csv, filename) {
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function parseTopicCorrectionCsv(text) {
    var cleanText = String(text || "").replace(/^\uFEFF/, "");
    var delimiterInfo = detectDelimiter(cleanText);
    var lines = splitCsv(cleanText, delimiterInfo.value).filter(function (line) {
      return line.some(function (value) {
        return normalizeHeader(value) !== "";
      });
    });

    if (lines.length < 2) {
      throw new Error("修正库 CSV 至少需要表头和 1 条数据。");
    }

    var headerIndex = -1;
    var headers = [];
    for (var i = 0; i < Math.min(lines.length, 10); i += 1) {
      headers = lines[i].map(normalizeHeader);
      if (
        findOptionalHeaderIndex(headers, ["原始笔记标题"]) !== -1 &&
        findOptionalHeaderIndex(headers, ["选题/菜品名", "选题", "菜品名"]) !== -1
      ) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("没有找到“原始笔记标题”和“选题/菜品名”这两列表头。");
    }

    var titleIndex = findOptionalHeaderIndex(headers, ["原始笔记标题"]);
    var topicIndex = findOptionalHeaderIndex(headers, ["选题/菜品名", "选题", "菜品名"]);
    var imported = [];
    lines.slice(headerIndex + 1).forEach(function (line) {
      var originalTitle = cleanCell(line[titleIndex]);
      var topic = cleanCell(line[topicIndex]);
      if (originalTitle && topic && topic !== "待填写") {
        imported.push({
          originalTitle: originalTitle,
          topic: topic
        });
      }
    });

    return imported;
  }
}());
