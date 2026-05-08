(function () {
  const data = window.toolsPageData;

  if (!data) {
    return;
  }

  const storageKeys = {
    session: "study-tools-session-config",
    persistent: "study-tools-persistent-config"
  };

  const state = {
    activeTool: "matrix",
    providerId: "openai",
    imagePayload: null
  };

  const nodes = {
    providerCards: document.querySelector("#provider-cards"),
    safetyCards: document.querySelector("#safety-cards"),
    tabBar: document.querySelector("#tool-tabs"),
    providerSelect: document.querySelector("#provider-select"),
    baseUrlInput: document.querySelector("#base-url"),
    modelInput: document.querySelector("#model-name"),
    apiKeyInput: document.querySelector("#api-key"),
    rememberToggle: document.querySelector("#remember-key"),
    clearConfig: document.querySelector("#clear-config"),
    providerStatus: document.querySelector("#provider-status"),
    visionHint: document.querySelector("#vision-hint"),
    matrixA: document.querySelector("#matrix-a"),
    matrixB: document.querySelector("#matrix-b"),
    matrixOperation: document.querySelector("#matrix-operation"),
    matrixRun: document.querySelector("#matrix-run"),
    matrixExample: document.querySelector("#matrix-example"),
    matrixResult: document.querySelector("#matrix-result"),
    matrixMeta: document.querySelector("#matrix-meta"),
    latexMode: document.querySelector("#latex-mode"),
    latexPrompt: document.querySelector("#latex-source"),
    latexRun: document.querySelector("#latex-run"),
    latexCopy: document.querySelector("#latex-copy"),
    latexResult: document.querySelector("#latex-result"),
    latexStatus: document.querySelector("#latex-status"),
    latexPreview: document.querySelector("#latex-preview"),
    ocrFile: document.querySelector("#ocr-file"),
    ocrPrompt: document.querySelector("#ocr-prompt"),
    ocrRun: document.querySelector("#ocr-run"),
    ocrCopy: document.querySelector("#ocr-copy"),
    ocrResult: document.querySelector("#ocr-result"),
    ocrStatus: document.querySelector("#ocr-status"),
    ocrPreview: document.querySelector("#ocr-preview"),
    toolPanels: document.querySelectorAll("[data-tool-panel]")
  };

  init();

  function init() {
    renderProviderCards();
    renderSafetyCards();
    renderToolTabs();
    renderLatexModes();
    loadSavedConfig();
    bindConfigEvents();
    bindToolEvents();
    fillMatrixExamples();
    applyProviderPreset(state.providerId);
    switchTool(state.activeTool);
    updateProviderStatus();
  }

  function renderProviderCards() {
    if (!nodes.providerCards) {
      return;
    }

    nodes.providerCards.innerHTML = data.providerHighlights.map((provider) => `
      <article class="provider-card">
        <h3>${provider.title}</h3>
        <p>${provider.summary}</p>
        <div class="provider-meta">
          ${provider.meta.map((item) => `<span>${item}</span>`).join("")}
        </div>
      </article>
    `).join("");
  }

  function renderSafetyCards() {
    if (!nodes.safetyCards) {
      return;
    }

    nodes.safetyCards.innerHTML = data.safetyNotes.map((note) => `
      <article class="safety-card">
        <h3>${note.title}</h3>
        <p>${note.summary}</p>
      </article>
    `).join("");
  }

  function renderToolTabs() {
    if (!nodes.tabBar) {
      return;
    }

    nodes.tabBar.innerHTML = data.toolTabs.map((tool) => `
      <button type="button" data-tool-tab="${tool.id}" class="${tool.id === state.activeTool ? "is-active" : ""}">
        ${tool.label}
      </button>
    `).join("");
  }

  function renderLatexModes() {
    if (!nodes.latexMode) {
      return;
    }

    nodes.latexMode.innerHTML = data.latexModes.map((mode) => `
      <option value="${mode.value}">${mode.label}</option>
    `).join("");
  }

  function bindConfigEvents() {
    populateProviderSelect();

    nodes.providerSelect.addEventListener("change", (event) => {
      const providerId = event.target.value;
      state.providerId = providerId;
      applyProviderPreset(providerId);
      saveConfig();
      updateProviderStatus();
    });

    [nodes.baseUrlInput, nodes.modelInput, nodes.apiKeyInput].forEach((node) => {
      node.addEventListener("input", () => {
        saveConfig();
        updateProviderStatus();
      });
    });

    nodes.rememberToggle.addEventListener("change", () => {
      saveConfig();
      updateProviderStatus();
    });

    nodes.clearConfig.addEventListener("click", () => {
      sessionStorage.removeItem(storageKeys.session);
      localStorage.removeItem(storageKeys.persistent);
      nodes.apiKeyInput.value = "";
      nodes.rememberToggle.checked = false;
      applyProviderPreset(nodes.providerSelect.value);
      saveConfig();
      updateProviderStatus("配置已清除，本页不会继续保留 API Key。", "status-success");
    });
  }

  function bindToolEvents() {
    nodes.tabBar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool-tab]");
      if (!button) {
        return;
      }

      switchTool(button.dataset.toolTab);
    });

    nodes.matrixRun.addEventListener("click", runMatrixTool);
    nodes.matrixExample.addEventListener("click", fillMatrixExamples);
    nodes.latexRun.addEventListener("click", runLatexTool);
    nodes.latexCopy.addEventListener("click", () => copyText(nodes.latexResult.textContent, nodes.latexStatus));
    nodes.ocrRun.addEventListener("click", runOcrTool);
    nodes.ocrCopy.addEventListener("click", () => copyText(nodes.ocrResult.textContent, nodes.ocrStatus));
    nodes.ocrFile.addEventListener("change", handleImageUpload);
    nodes.latexMode.addEventListener("change", () => {
      nodes.latexStatus.textContent = describeLatexMode(nodes.latexMode.value);
      nodes.latexStatus.className = "provider-status";
    });
  }

  function populateProviderSelect() {
    nodes.providerSelect.innerHTML = Object.values(data.providers).map((provider) => `
      <option value="${provider.id}">${provider.label}</option>
    `).join("");
  }

  function loadSavedConfig() {
    const persistedRaw = localStorage.getItem(storageKeys.persistent);
    const sessionRaw = sessionStorage.getItem(storageKeys.session);
    const saved = safeParseJson(persistedRaw) || safeParseJson(sessionRaw);

    if (!saved) {
      return;
    }

    if (saved.providerId && data.providers[saved.providerId]) {
      state.providerId = saved.providerId;
    }

    nodes.providerSelect.value = state.providerId;
    applyProviderPreset(state.providerId);

    if (saved.baseUrl) {
      nodes.baseUrlInput.value = saved.baseUrl;
    }

    if (saved.model) {
      nodes.modelInput.value = saved.model;
    }

    if (saved.apiKey) {
      nodes.apiKeyInput.value = saved.apiKey;
    }

    nodes.rememberToggle.checked = Boolean(saved.remember);
  }

  function saveConfig() {
    const payload = {
      providerId: nodes.providerSelect.value,
      baseUrl: nodes.baseUrlInput.value.trim(),
      model: nodes.modelInput.value.trim(),
      apiKey: nodes.apiKeyInput.value.trim(),
      remember: nodes.rememberToggle.checked
    };

    sessionStorage.setItem(storageKeys.session, JSON.stringify(payload));

    if (payload.remember) {
      localStorage.setItem(storageKeys.persistent, JSON.stringify(payload));
    } else {
      localStorage.removeItem(storageKeys.persistent);
    }
  }

  function applyProviderPreset(providerId) {
    const provider = data.providers[providerId];

    if (!provider) {
      return;
    }

    nodes.providerSelect.value = providerId;
    nodes.baseUrlInput.value = provider.defaultBaseUrl;
    nodes.modelInput.value = provider.defaultModel;
    state.providerId = providerId;
    updateVisionHint(provider);
  }

  function updateProviderStatus(message, className) {
    const provider = getCurrentProvider();
    const apiKey = nodes.apiKeyInput.value.trim();
    const baseUrl = nodes.baseUrlInput.value.trim();
    const model = nodes.modelInput.value.trim();

    if (message) {
      nodes.providerStatus.textContent = message;
      nodes.providerStatus.className = `provider-status ${className || ""}`.trim();
      return;
    }

    if (!apiKey) {
      nodes.providerStatus.textContent = "矩阵计算可以直接使用。AI 工具需要先填写 API Key。";
      nodes.providerStatus.className = "provider-status";
      return;
    }

    nodes.providerStatus.textContent = `当前提供商：${provider.label} · 接口：${provider.endpointLabel} · 模型：${model || "未填写"} · Base URL：${baseUrl || "未填写"}`;
    nodes.providerStatus.className = "provider-status status-success";
  }

  function updateVisionHint(provider) {
    if (!nodes.visionHint) {
      return;
    }

    nodes.visionHint.textContent = provider.supportsVision
      ? `${provider.label} 已启用图像输入，截图公式工具可直接调用。`
      : `${provider.label} 当前按文本接口接入，截图公式转 LaTeX 工具会提示切换到支持图像的提供商。`;
  }

  function switchTool(toolId) {
    state.activeTool = toolId;
    nodes.toolPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.toolPanel === toolId);
    });

    nodes.tabBar.querySelectorAll("[data-tool-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.toolTab === toolId);
    });
  }

  function fillMatrixExamples() {
    nodes.matrixA.value = data.matrixExamples.matrixA;
    nodes.matrixB.value = data.matrixExamples.matrixB;
  }

  function runMatrixTool() {
    try {
      const matrixA = parseMatrix(nodes.matrixA.value);
      const matrixB = nodes.matrixB.value.trim() ? parseMatrix(nodes.matrixB.value) : null;
      const operation = nodes.matrixOperation.value;

      let result;
      let meta = "";

      switch (operation) {
        case "add":
          result = addMatrices(matrixA, requireMatrixB(matrixB));
          meta = "A + B";
          break;
        case "subtract":
          result = subtractMatrices(matrixA, requireMatrixB(matrixB));
          meta = "A - B";
          break;
        case "multiply":
          result = multiplyMatrices(matrixA, requireMatrixB(matrixB));
          meta = "A × B";
          break;
        case "transpose":
          result = transposeMatrix(matrixA);
          meta = "A^T";
          break;
        case "inverse":
          result = inverseMatrix(matrixA);
          meta = "A^-1";
          break;
        case "determinant":
          result = determinant(matrixA);
          meta = "det(A)";
          break;
        default:
          throw new Error("暂不支持这个矩阵操作。");
      }

      if (Array.isArray(result)) {
        nodes.matrixResult.innerHTML = `${renderMatrixTable(result)}<pre>${formatMatrix(result)}</pre>`;
      } else {
        nodes.matrixResult.innerHTML = `<pre>${String(roundNumber(result))}</pre>`;
      }

      nodes.matrixMeta.textContent = `计算完成：${meta}`;
      nodes.matrixMeta.className = "provider-status status-success";
    } catch (error) {
      nodes.matrixResult.innerHTML = `<div class="result-empty status-error">${escapeHtml(error.message)}</div>`;
      nodes.matrixMeta.textContent = "请检查矩阵维度、格式或所选运算。";
      nodes.matrixMeta.className = "provider-status status-error";
    }
  }

  async function runLatexTool() {
    const source = nodes.latexPrompt.value.trim();

    if (!source) {
      nodes.latexStatus.textContent = "先输入要整理或解释的内容。";
      nodes.latexStatus.className = "provider-status status-error";
      return;
    }

    try {
      setBusy(nodes.latexRun, true, "处理中...");
      nodes.latexStatus.textContent = "模型调用中...";
      nodes.latexStatus.className = "provider-status";

      const mode = data.latexModes.find((item) => item.value === nodes.latexMode.value);
      const prompt = `${mode.prompt}\n\n待处理内容：\n${source}`;
      const result = await callTextModel(prompt);

      nodes.latexResult.textContent = result;
      nodes.latexPreview.textContent = result;
      nodes.latexStatus.textContent = "已生成结果，可直接复制。";
      nodes.latexStatus.className = "provider-status status-success";
    } catch (error) {
      nodes.latexStatus.textContent = normalizeError(error);
      nodes.latexStatus.className = "provider-status status-error";
    } finally {
      setBusy(nodes.latexRun, false, "生成结果");
    }
  }

  async function runOcrTool() {
    const provider = getCurrentProvider();
    const prompt = nodes.ocrPrompt.value.trim();

    if (!state.imagePayload) {
      nodes.ocrStatus.textContent = "先上传一张包含公式的截图。";
      nodes.ocrStatus.className = "provider-status status-error";
      return;
    }

    if (!provider.supportsVision) {
      nodes.ocrStatus.textContent = `${provider.label} 当前在这个页面里按文本接口接入，请切换到 OpenAI、Claude 或 Kimi。`;
      nodes.ocrStatus.className = "provider-status status-error";
      return;
    }

    try {
      setBusy(nodes.ocrRun, true, "识别中...");
      nodes.ocrStatus.textContent = "图片上传完成，正在请求模型识别公式...";
      nodes.ocrStatus.className = "provider-status";

      const result = await callVisionModel(prompt || defaultOcrPrompt(), state.imagePayload);
      nodes.ocrResult.textContent = result;
      nodes.ocrStatus.textContent = "识别完成，可直接复制到 LaTeX 编辑器中。";
      nodes.ocrStatus.className = "provider-status status-success";
    } catch (error) {
      nodes.ocrStatus.textContent = normalizeError(error);
      nodes.ocrStatus.className = "provider-status status-error";
    } finally {
      setBusy(nodes.ocrRun, false, "识别公式");
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      state.imagePayload = {
        dataUrl,
        mimeType: file.type || "image/png",
        base64: dataUrl.split(",")[1]
      };

      nodes.ocrPreview.innerHTML = `<img src="${dataUrl}" alt="公式截图预览">`;
      nodes.ocrStatus.textContent = `已载入图片：${file.name}`;
      nodes.ocrStatus.className = "provider-status status-success";
    };
    reader.readAsDataURL(file);
  }

  async function callTextModel(prompt) {
    const provider = getCurrentProvider();
    const config = requireApiConfig();

    switch (provider.protocol) {
      case "responses":
        return callOpenAIResponses(config, prompt);
      case "anthropic-messages":
        return callAnthropicMessages(config, prompt);
      case "openai-chat":
        return callOpenAICompatibleChat(config, prompt);
      default:
        throw new Error("当前提供商适配器不可用。");
    }
  }

  async function callVisionModel(prompt, imagePayload) {
    const provider = getCurrentProvider();
    const config = requireApiConfig();

    switch (provider.protocol) {
      case "responses":
        return callOpenAIResponses(config, prompt, imagePayload);
      case "anthropic-messages":
        return callAnthropicMessages(config, prompt, imagePayload);
      case "openai-chat":
        return callOpenAICompatibleChat(config, prompt, imagePayload);
      default:
        throw new Error("当前提供商适配器不支持图像输入。");
    }
  }

  async function callOpenAIResponses(config, prompt, imagePayload) {
    const inputContent = [{ type: "input_text", text: prompt }];

    if (imagePayload) {
      inputContent.push({
        type: "input_image",
        image_url: imagePayload.dataUrl,
        detail: "high"
      });
    }

    const response = await fetch(joinUrl(config.baseUrl, "responses"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        input: [{ role: "user", content: inputContent }]
      })
    });

    const payload = await readJson(response);
    ensureOk(response, payload);
    return extractOpenAIResponsesText(payload);
  }

  async function callAnthropicMessages(config, prompt, imagePayload) {
    const content = [];

    if (imagePayload) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imagePayload.mimeType,
          data: imagePayload.base64
        }
      });
    }

    content.push({
      type: "text",
      text: prompt
    });

    const response = await fetch(joinUrl(config.baseUrl, "messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1200,
        messages: [{ role: "user", content }]
      })
    });

    const payload = await readJson(response);
    ensureOk(response, payload);
    const textBlocks = (payload.content || []).filter((item) => item.type === "text");
    return textBlocks.map((item) => item.text).join("\n").trim();
  }

  async function callOpenAICompatibleChat(config, prompt, imagePayload) {
    const content = [{ type: "text", text: prompt }];

    if (imagePayload) {
      content.push({
        type: "image_url",
        image_url: {
          url: imagePayload.dataUrl
        }
      });
    }

    const response = await fetch(joinUrl(config.baseUrl, "chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content }],
        temperature: 0.2
      })
    });

    const payload = await readJson(response);
    ensureOk(response, payload);
    const choice = payload.choices && payload.choices[0];
    const message = choice && choice.message;

    if (!message) {
      throw new Error("模型没有返回可用内容。");
    }

    if (typeof message.content === "string") {
      return message.content.trim();
    }

    if (Array.isArray(message.content)) {
      return message.content.map((item) => item.text || "").join("\n").trim();
    }

    throw new Error("无法解析模型返回内容。");
  }

  function requireApiConfig() {
    const apiKey = nodes.apiKeyInput.value.trim();
    const baseUrl = nodes.baseUrlInput.value.trim();
    const model = nodes.modelInput.value.trim();

    if (!apiKey || !baseUrl || !model) {
      throw new Error("请先填写提供商、Base URL、模型名和 API Key。");
    }

    return {
      apiKey,
      baseUrl,
      model
    };
  }

  function getCurrentProvider() {
    return data.providers[nodes.providerSelect.value];
  }

  function describeLatexMode(modeValue) {
    const mode = data.latexModes.find((item) => item.value === modeValue);
    return mode ? mode.prompt : "选择一个 LaTeX 处理模式。";
  }

  function defaultOcrPrompt() {
    return "请识别图片中的数学公式，并输出纯 LaTeX。不要加 Markdown 代码块，不要额外解释。";
  }

  function setBusy(button, busy, text) {
    button.disabled = busy;
    if (text) {
      button.textContent = text;
    }

    if (!busy) {
      if (button === nodes.latexRun) {
        button.textContent = "生成结果";
      }
      if (button === nodes.ocrRun) {
        button.textContent = "识别公式";
      }
    }
  }

  function copyText(value, statusNode) {
    if (!value || value.includes("结果会显示在这里")) {
      statusNode.textContent = "当前没有可复制的内容。";
      statusNode.className = "provider-status status-error";
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      statusNode.textContent = "已复制到剪贴板。";
      statusNode.className = "provider-status status-success";
    }).catch(() => {
      statusNode.textContent = "复制失败，请手动选择文本。";
      statusNode.className = "provider-status status-error";
    });
  }

  function parseMatrix(raw) {
    const rows = raw.trim().split(/\n+/).map((line) => line.trim()).filter(Boolean);

    if (!rows.length) {
      throw new Error("矩阵内容不能为空。");
    }

    const matrix = rows.map((line) => {
      const cells = line.split(/[\s,，;；]+/).filter(Boolean).map(Number);

      if (cells.some((value) => Number.isNaN(value))) {
        throw new Error("矩阵中包含无法解析的数字。");
      }

      return cells;
    });

    const width = matrix[0].length;

    if (!width || matrix.some((row) => row.length !== width)) {
      throw new Error("每一行的列数需要一致。");
    }

    return matrix;
  }

  function requireMatrixB(matrix) {
    if (!matrix) {
      throw new Error("当前操作需要矩阵 B。");
    }
    return matrix;
  }

  function addMatrices(a, b) {
    assertSameShape(a, b);
    return a.map((row, rowIndex) => row.map((value, colIndex) => roundNumber(value + b[rowIndex][colIndex])));
  }

  function subtractMatrices(a, b) {
    assertSameShape(a, b);
    return a.map((row, rowIndex) => row.map((value, colIndex) => roundNumber(value - b[rowIndex][colIndex])));
  }

  function multiplyMatrices(a, b) {
    if (a[0].length !== b.length) {
      throw new Error("矩阵乘法要求 A 的列数等于 B 的行数。");
    }

    return a.map((row) => b[0].map((_, colIndex) => {
      let total = 0;
      for (let i = 0; i < b.length; i += 1) {
        total += row[i] * b[i][colIndex];
      }
      return roundNumber(total);
    }));
  }

  function transposeMatrix(matrix) {
    return matrix[0].map((_, columnIndex) => matrix.map((row) => roundNumber(row[columnIndex])));
  }

  function determinant(matrix) {
    ensureSquare(matrix, "行列式计算");
    const clone = matrix.map((row) => row.slice());
    let det = 1;

    for (let i = 0; i < clone.length; i += 1) {
      let pivot = i;
      while (pivot < clone.length && Math.abs(clone[pivot][i]) < 1e-10) {
        pivot += 1;
      }

      if (pivot === clone.length) {
        return 0;
      }

      if (pivot !== i) {
        [clone[pivot], clone[i]] = [clone[i], clone[pivot]];
        det *= -1;
      }

      const pivotValue = clone[i][i];
      det *= pivotValue;

      for (let row = i + 1; row < clone.length; row += 1) {
        const factor = clone[row][i] / pivotValue;
        for (let col = i; col < clone.length; col += 1) {
          clone[row][col] -= factor * clone[i][col];
        }
      }
    }

    return roundNumber(det);
  }

  function inverseMatrix(matrix) {
    ensureSquare(matrix, "求逆");
    const size = matrix.length;
    const augmented = matrix.map((row, rowIndex) => [
      ...row.map((value) => value),
      ...Array.from({ length: size }, (_, colIndex) => (rowIndex === colIndex ? 1 : 0))
    ]);

    for (let i = 0; i < size; i += 1) {
      let pivot = i;
      while (pivot < size && Math.abs(augmented[pivot][i]) < 1e-10) {
        pivot += 1;
      }

      if (pivot === size) {
        throw new Error("矩阵不可逆。");
      }

      if (pivot !== i) {
        [augmented[pivot], augmented[i]] = [augmented[i], augmented[pivot]];
      }

      const pivotValue = augmented[i][i];
      for (let col = 0; col < augmented[i].length; col += 1) {
        augmented[i][col] /= pivotValue;
      }

      for (let row = 0; row < size; row += 1) {
        if (row === i) {
          continue;
        }
        const factor = augmented[row][i];
        for (let col = 0; col < augmented[row].length; col += 1) {
          augmented[row][col] -= factor * augmented[i][col];
        }
      }
    }

    return augmented.map((row) => row.slice(size).map((value) => roundNumber(value)));
  }

  function assertSameShape(a, b) {
    if (a.length !== b.length || a[0].length !== b[0].length) {
      throw new Error("矩阵加减法要求 A 和 B 维度一致。");
    }
  }

  function ensureSquare(matrix, action) {
    if (matrix.length !== matrix[0].length) {
      throw new Error(`${action}要求矩阵 A 为方阵。`);
    }
  }

  function renderMatrixTable(matrix) {
    const header = matrix[0].map((_, index) => `<th>${index + 1}</th>`).join("");
    const body = matrix.map((row, rowIndex) => `
      <tr>
        <th>${rowIndex + 1}</th>
        ${row.map((value) => `<td>${roundNumber(value)}</td>`).join("")}
      </tr>
    `).join("");

    return `
      <table class="matrix-table">
        <thead>
          <tr><th>#</th>${header}</tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  function formatMatrix(matrix) {
    return matrix.map((row) => row.map((value) => roundNumber(value)).join("\t")).join("\n");
  }

  function roundNumber(value) {
    return Number(Math.abs(value) < 1e-10 ? 0 : value.toFixed(6));
  }

  function joinUrl(baseUrl, path) {
    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.replace(/^\/+/, "");
    return `${normalizedBase}/${normalizedPath}`;
  }

  function safeParseJson(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function readJson(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { raw: text };
    }
  }

  function ensureOk(response, payload) {
    if (response.ok) {
      return;
    }

    const message =
      payload && payload.error && (payload.error.message || payload.error.type) ||
      payload && payload.message ||
      payload && payload.raw ||
      `请求失败，状态码 ${response.status}`;

    throw new Error(message);
  }

  function extractOpenAIResponsesText(payload) {
    if (payload.output_text) {
      return payload.output_text.trim();
    }

    const outputs = payload.output || [];
    const texts = [];

    outputs.forEach((item) => {
      (item.content || []).forEach((content) => {
        if (content.type === "output_text" && content.text) {
          texts.push(content.text);
        }
      });
    });

    if (!texts.length) {
      throw new Error("模型没有返回可用文本。");
    }

    return texts.join("\n").trim();
  }

  function normalizeError(error) {
    if (!error) {
      return "请求失败，请检查配置后重试。";
    }

    const message = String(error.message || error);

    if (/Failed to fetch/i.test(message)) {
      return "浏览器请求被拦截，可能是 CORS、网络代理或提供商限制导致。请检查浏览器控制台和提供商配置。";
    }

    return message;
  }

  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return String(text).replace(/[&<>"']/g, (char) => map[char]);
  }
})();
