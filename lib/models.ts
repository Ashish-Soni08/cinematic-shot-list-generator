export type ModelOption = {
  id: string
  name: string
  tagline: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'openai/gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    tagline: 'Fastest, lowest cost',
  },
  {
    id: 'openai/gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    tagline: 'Balanced speed and quality',
  },
  {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    tagline: 'Rich cinematic language',
  },
  {
    id: 'openai/gpt-5.4',
    name: 'GPT-5.4',
    tagline: 'Highest quality, slower',
  },
]

export const DEFAULT_MODEL_ID = 'openai/gpt-5.4-mini'

export function isAllowedModel(id: unknown): id is string {
  return typeof id === 'string' && MODEL_OPTIONS.some((m) => m.id === id)
}

export type GenerationSummary = {
  __summary: true
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number | null
}
