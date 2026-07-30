// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
/**
 * 第三方模型单一数据源 (local source of truth)。
 *
 * 背景:cc-haha 内置的模型能力检测 (modelCapabilities.ts) 与官方域名绑定,
 * 走第三方 Anthropic 兼容端点时拿不到上下文窗口大小,会回退到 200k 默认值,
 * 导致百万上下文模型被提前压缩。CLI 也只认一组 ANTHROPIC_BASE_URL + token,
 * 不支持按模型切换端点/密钥。
 *
 * 本文件集中维护"模型 → {端点, 密钥, 上下文窗口, 输出上限, picker 展示}"
 * 的映射,供 client.ts (路由端点+密钥)、context.ts (上下文窗口)、
 * modelOptions.ts (/model picker) 三处复用。新增第三方模型只需在此加一项。
 */

// 第三方模型条目
export type ThirdPartyModelEntry = {
  /** 发往 API 的模型字符串 (/model 选中后落到 ANTHROPIC_MODEL) */
  id: string
  /** picker 列表里展示的名字 */
  label: string
  /** picker 列表里的一行描述 */
  description: string
  /** 该模型对应的 Anthropic 兼容端点 */
  baseURL: string
  /** 读取密钥的环境变量名 (Bearer token) */
  apiKeyEnv: string
  /** 上下文窗口大小 (token) */
  maxInputTokens: number
  /** 单次输出上限 (token) */
  maxOutputTokens: number
}

/**
 * 第三方模型表。
 * DeepSeek V4 Pro / Kimi K3 均 1M 上下文。
 * - DeepSeek 官方 Anthropic 兼容端点: https://api.deepseek.com/anthropic
 * - Moonshot 官方 Anthropic 兼容端点: https://api.moonshot.cn/anthropic
 */
export const THIRD_PARTY_MODELS: ThirdPartyModelEntry[] = [
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    description: 'DeepSeek V4 Pro · 1M 上下文 (api.deepseek.com)',
    baseURL: 'https://api.deepseek.com/anthropic',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    maxInputTokens: 1_048_576,
    maxOutputTokens: 384_000,
  },
  {
    id: 'kimi-k3',
    label: 'Kimi K3',
    description: 'Kimi K3 · 1M 上下文 (api.moonshot.cn)',
    baseURL: 'https://api.moonshot.cn/anthropic',
    apiKeyEnv: 'KIMI_API_KEY',
    maxInputTokens: 1_048_576,
    maxOutputTokens: 384_000,
  },
]

/** 按模型字符串查第三方条目;命中返回条目,否则 undefined。大小写不敏感。 */
export function getThirdPartyModel(
  model: string | undefined | null,
): ThirdPartyModelEntry | undefined {
  if (!model) return undefined
  const m = model.toLowerCase()
  return THIRD_PARTY_MODELS.find(
    e => e.id.toLowerCase() === m || m.includes(e.id.toLowerCase()),
  )
}

/** 当前是否启用了第三方模型路由 (表非空即视为启用) */
export function isThirdPartyRoutingEnabled(): boolean {
  return THIRD_PARTY_MODELS.length > 0
}

/**
 * 取某第三方模型对应的 client 配置覆盖项。
 * 供 client.ts 的 getAnthropicClient 使用:
 * - baseURL 覆盖 SDK 默认 (否则会用 process.env.ANTHROPIC_BASE_URL)
 * - apiKey 经 SDK 走 x-api-key (DeepSeek/Moonshot 均接受 x-api-key)
 * 命中返回 {baseURL, apiKey};未命中返回 undefined (走原有逻辑)。
 */
export function getThirdPartyClientConfig(
  model: string | undefined | null,
): { baseURL: string; apiKey: string } | undefined {
  const entry = getThirdPartyModel(model)
  if (!entry) return undefined
  const apiKey = process.env[entry.apiKeyEnv]
  if (!apiKey) {
    // 密钥缺失:不覆盖,让原逻辑用 ANTHROPIC_API_KEY 兜底 (会失败,但错误可见)
    return undefined
  }
  return { baseURL: entry.baseURL, apiKey }
}

/** picker 用的选项类型,与 modelOptions.ts 的 ModelOption 结构对齐 */
export type ThirdPartyModelOption = {
  value: string
  label: string
  description: string
}

/** 把第三方模型转成 /model picker 选项列表 */
export function getThirdPartyModelOptions(): ThirdPartyModelOption[] {
  return THIRD_PARTY_MODELS.map(e => ({
    value: e.id,
    label: e.label,
    description: e.description,
  }))
}
