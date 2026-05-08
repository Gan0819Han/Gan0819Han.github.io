window.toolsPageData = {
  providers: {
    openai: {
      id: "openai",
      label: "OpenAI / GPT",
      protocol: "responses",
      endpointLabel: "POST /v1/responses",
      defaultBaseUrl: "https://api.openai.com/v1",
      defaultModel: "gpt-5-mini",
      supportsVision: true,
      supportsLatex: true,
      note: "适合文本与图像混合输入，默认走 Responses API。"
    },
    claude: {
      id: "claude",
      label: "Anthropic / Claude",
      protocol: "anthropic-messages",
      endpointLabel: "POST /v1/messages",
      defaultBaseUrl: "https://api.anthropic.com/v1",
      defaultModel: "claude-sonnet-4-20250514",
      supportsVision: true,
      supportsLatex: true,
      note: "适合长文本和图像理解，走 Messages API。"
    },
    kimi: {
      id: "kimi",
      label: "Kimi / Moonshot",
      protocol: "openai-chat",
      endpointLabel: "POST /v1/chat/completions",
      defaultBaseUrl: "https://api.moonshot.cn/v1",
      defaultModel: "kimi-k2.6",
      supportsVision: true,
      supportsLatex: true,
      note: "采用 OpenAI 兼容格式，适合中文场景和多模态输入。"
    },
    deepseek: {
      id: "deepseek",
      label: "DeepSeek",
      protocol: "openai-chat",
      endpointLabel: "POST /chat/completions",
      defaultBaseUrl: "https://api.deepseek.com",
      defaultModel: "deepseek-v4-flash",
      supportsVision: false,
      supportsLatex: true,
      note: "默认按 OpenAI 兼容文本接口接入，适合文本推理与公式整理。"
    }
  },
  providerHighlights: [
    {
      title: "OpenAI / GPT",
      summary: "支持 Responses API 的文本与图像输入，适合 LaTeX 生成和截图识别。",
      meta: ["默认模型: gpt-5-mini", "接口: /v1/responses", "支持图像"]
    },
    {
      title: "Anthropic / Claude",
      summary: "适合长文本解释和图像输入，接口独立但前端可以统一封装。",
      meta: ["默认模型: claude-sonnet-4-20250514", "接口: /v1/messages", "支持图像"]
    },
    {
      title: "Kimi / Moonshot",
      summary: "使用 OpenAI 兼容格式接入，适合中文学习工具和多模态任务。",
      meta: ["默认模型: kimi-k2.6", "接口: /v1/chat/completions", "支持图像"]
    },
    {
      title: "DeepSeek",
      summary: "同样可通过 OpenAI 兼容方式接入，当前页默认用于文本类工具。",
      meta: ["默认模型: deepseek-v4-flash", "接口: /chat/completions", "文本优先"]
    }
  ],
  safetyNotes: [
    {
      title: "BYOK 模式",
      summary: "平台只提供工具界面与适配层，调用费用和额度都走访客自己的账号。"
    },
    {
      title: "默认本地保存",
      summary: "API Key 默认只保存在当前浏览器会话中，可选记住到本机。"
    },
    {
      title: "工具分层",
      summary: "矩阵计算在本地浏览器执行，LaTeX 助手和 OCR 工具再按需调用模型接口。"
    }
  ],
  toolTabs: [
    {
      id: "matrix",
      label: "矩阵计算",
      summary: "本地运行，不依赖任何模型或 API。"
    },
    {
      id: "latex",
      label: "LaTeX 助手",
      summary: "适合文字转 LaTeX、LaTeX 释义与公式整理。"
    },
    {
      id: "ocr",
      label: "截图公式转 LaTeX",
      summary: "适合把截图中的公式识别为可复制的 LaTeX。"
    }
  ],
  latexModes: [
    {
      value: "to-latex",
      label: "描述转 LaTeX",
      prompt: "请把下面的数学表达、中文描述或公式草稿整理成可直接复制使用的 LaTeX。只输出最终 LaTeX，不要使用 Markdown 代码块，不要额外解释。"
    },
    {
      value: "explain-latex",
      label: "解释 LaTeX",
      prompt: "请解释下面这段 LaTeX 公式在表达什么，并给出清晰的中文说明。先给简洁解释，再指出关键符号含义。"
    },
    {
      value: "polish-latex",
      label: "整理已有 LaTeX",
      prompt: "请整理下面的 LaTeX，让其结构更清晰、可读性更好。保留原始数学含义，只输出整理后的 LaTeX，不要额外解释。"
    }
  ],
  matrixExamples: {
    matrixA: "1 2 3\n0 1 4\n5 6 0",
    matrixB: "2 0 1\n1 3 2\n4 0 1"
  }
};
