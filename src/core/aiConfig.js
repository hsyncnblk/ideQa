/**
 * @module core/aiConfig
 *
 * Manages user-provided AI tokens & provider selections.
 * Stored in localStorage so it persists even if the user logs out of Jira.
 * Providers supported: 'gemini' | 'claude'
 */

const STORAGE_KEYS = {
  PROVIDER: 'ideqa_ai_provider',
  GEMINI_TOKEN: 'ideqa_ai_gemini_token',
  CLAUDE_TOKEN: 'ideqa_ai_claude_token',
};

export const AI_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-1.5-flash', placeholder: 'AIzaSy...' },
  { id: 'claude', name: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20241022', placeholder: 'sk-ant-api03-...' },
];

export function getAiConfig() {
  if (typeof window === 'undefined') {
    return { provider: 'gemini', geminiToken: '', claudeToken: '' };
  }
  const provider = localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'gemini';
  const geminiToken = localStorage.getItem(STORAGE_KEYS.GEMINI_TOKEN) || '';
  const claudeToken = localStorage.getItem(STORAGE_KEYS.CLAUDE_TOKEN) || '';

  return {
    provider,
    geminiToken,
    claudeToken,
    activeToken: provider === 'claude' ? claudeToken : geminiToken,
    hasToken: Boolean(provider === 'claude' ? claudeToken.trim() : geminiToken.trim()),
  };
}

export function saveAiConfig({ provider, token }) {
  if (typeof window === 'undefined') return;
  if (provider) {
    localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
  }
  const targetProvider = provider || localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'gemini';
  if (token !== undefined) {
    if (targetProvider === 'claude') {
      localStorage.setItem(STORAGE_KEYS.CLAUDE_TOKEN, token.trim());
    } else {
      localStorage.setItem(STORAGE_KEYS.GEMINI_TOKEN, token.trim());
    }
  }
}

