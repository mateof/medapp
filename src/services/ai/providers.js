/**
 * Registro de proveedores de IA disponibles.
 * Cada proveedor tiene su configuración, modelos recomendados y tipo de API.
 */

export const AI_PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'mdi-google',
    color: '#4285F4',
    apiType: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    keyPlaceholder: 'AIza...',
    keyLink: 'https://aistudio.google.com',
    keyLinkText: 'Google AI Studio',
    supportsModelList: true,
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Rápido y eficiente' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Más preciso, más lento' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Generación anterior rápida' },
    ],
  },

  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    icon: 'mdi-robot-outline',
    color: '#10A37F',
    apiType: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.openai.com/api-keys',
    keyLinkText: 'OpenAI Platform',
    supportsModelList: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal, rápido y preciso' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Ligero y económico' },
      { id: 'o3-mini', name: 'o3-mini', description: 'Razonamiento avanzado' },
    ],
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    icon: 'mdi-alpha-c-circle',
    color: '#D97706',
    apiType: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    keyPlaceholder: 'sk-ant-...',
    keyLink: 'https://console.anthropic.com/settings/keys',
    keyLinkText: 'Anthropic Console',
    supportsModelList: false,
    requiresProxy: true,
    proxyNote: 'Claude requiere proxy CORS o backend propio por las restricciones de su API.',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Equilibrio calidad/velocidad' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Rápido y económico' },
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Máxima calidad' },
    ],
  },

  copilot: {
    id: 'copilot',
    name: 'GitHub Copilot',
    icon: 'mdi-github',
    color: '#000000',
    apiType: 'openai',
    baseUrl: 'https://models.github.ai/inference',
    defaultModel: 'openai/gpt-4o',
    keyPlaceholder: 'github_pat_...',
    keyLink: 'https://github.com/settings/tokens',
    keyLinkText: 'GitHub Settings',
    supportsModelList: false,
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (GitHub)', description: 'Multimodal vía GitHub' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (GitHub)', description: 'Ligero vía GitHub' },
      { id: 'meta/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', description: 'Meta Llama vía GitHub' },
    ],
  },

  grok: {
    id: 'grok',
    name: 'xAI (Grok)',
    icon: 'mdi-alpha-x-box',
    color: '#1DA1F2',
    apiType: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3-mini',
    keyPlaceholder: 'xai-...',
    keyLink: 'https://console.x.ai',
    keyLinkText: 'xAI Console',
    supportsModelList: true,
    models: [
      { id: 'grok-3-mini', name: 'Grok 3 Mini', description: 'Rápido y eficiente' },
      { id: 'grok-3', name: 'Grok 3', description: 'Modelo completo' },
    ],
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: 'mdi-brain',
    color: '#4F46E5',
    apiType: 'openai',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.deepseek.com/api_keys',
    keyLinkText: 'DeepSeek Platform',
    supportsModelList: false,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', description: 'Modelo general potente' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'Razonamiento avanzado' },
    ],
  },

  local: {
    id: 'local',
    name: 'Servidor local',
    icon: 'mdi-server',
    color: '#6B7280',
    apiType: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    keyPlaceholder: 'opcional',
    keyLink: 'https://ollama.com',
    keyLinkText: 'Ollama',
    supportsModelList: true,
    customBaseUrl: true,
    keyOptional: true,
    baseUrlPresets: [
      { label: 'Ollama', url: 'http://localhost:11434/v1' },
      { label: 'LM Studio', url: 'http://localhost:1234/v1' },
      { label: 'vLLM', url: 'http://localhost:8000/v1' },
      { label: 'llama.cpp', url: 'http://localhost:8080/v1' },
      { label: 'LocalAI', url: 'http://localhost:8080/v1' },
      { label: 'text-generation-webui', url: 'http://localhost:5000/v1' },
    ],
    models: [
      { id: 'llama3', name: 'Llama 3', description: 'Meta Llama 3 (8B)' },
      { id: 'llama3:70b', name: 'Llama 3 70B', description: 'Meta Llama 3 (70B)' },
      { id: 'mistral', name: 'Mistral 7B', description: 'Mistral AI' },
      { id: 'mixtral', name: 'Mixtral 8x7B', description: 'Mistral AI MoE' },
      { id: 'gemma2', name: 'Gemma 2', description: 'Google Gemma 2' },
      { id: 'qwen2.5', name: 'Qwen 2.5', description: 'Alibaba Qwen' },
      { id: 'phi3', name: 'Phi-3', description: 'Microsoft Phi-3' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'DeepSeek R1 local' },
      { id: 'medllama2', name: 'MedLlama 2', description: 'Especializado en medicina' },
      { id: 'meditron', name: 'Meditron', description: 'LLM médico (EPFL)' },
    ],
  },
}

export function getProvider(providerId) {
  return AI_PROVIDERS[providerId] || null
}

export function getProviderList() {
  return Object.values(AI_PROVIDERS)
}
