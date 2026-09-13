/**
 * Application environment configuration
 * Reads safely from Vite environment variables with graceful fallbacks
 */

export const envConfig = {
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash',
  },
  jira: {
    baseUrl: import.meta.env.VITE_JIRA_BASE_URL || 'https://jira.idefix.com',
    defaultTeam: import.meta.env.VITE_DEFAULT_TEAM || 'Team Alpha',
    autoLabel: import.meta.env.VITE_AUTO_LABEL || 'otomasyon_ai',
  },
  isDevelopment: import.meta.env.DEV,
};
