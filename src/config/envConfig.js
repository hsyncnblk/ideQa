/**
 * Application environment configuration
 * Reads safely from Vite environment variables with graceful fallbacks
 */

export const envConfig = {
  jira: {
    get baseUrl() {
      const customUrl = typeof window !== 'undefined' ? localStorage.getItem('jira_custom_base_url') : null;
      return (customUrl || import.meta.env.VITE_JIRA_BASE_URL || 'https://hsynornek.atlassian.net').replace(/\/+$/, '');
    },
    defaultTeam: import.meta.env.VITE_DEFAULT_TEAM || 'Team Alpha',
    autoLabel: import.meta.env.VITE_AUTO_LABEL || 'otomasyon_ai',
  },
  isDevelopment: import.meta.env.DEV,
};
