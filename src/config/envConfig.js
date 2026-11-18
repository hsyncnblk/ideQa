/**
 * Application environment configuration
 * Reads safely from Vite environment variables with graceful fallbacks
 */

export const envConfig = {
  jira: {
    get baseUrl() {
      const customUrl = typeof window !== 'undefined' ? localStorage.getItem('jira_custom_base_url') : null;
      if (customUrl && !customUrl.includes('your-domain') && !customUrl.includes('turkuvaz-jira')) {
        return customUrl.replace(/\/+$/, '');
      }
      const envUrl = import.meta.env.VITE_JIRA_BASE_URL || '';
      if (envUrl && !envUrl.includes('your-domain') && !envUrl.includes('turkuvaz-jira')) {
        return envUrl.replace(/\/+$/, '');
      }
      return '';
    },
    defaultTeam: import.meta.env.VITE_DEFAULT_TEAM || '',
    autoLabel: import.meta.env.VITE_AUTO_LABEL || 'otomasyon_ai',
    get mpTeamFieldId() {
      const customField = typeof window !== 'undefined' ? localStorage.getItem('jira_mp_team_field_id') : null;
      return customField || import.meta.env.VITE_JIRA_MP_TEAM_FIELD_ID || '';
    },
  },
  isDevelopment: import.meta.env.DEV,
};
