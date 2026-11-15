/**
 * Application environment configuration
 * Reads safely from Vite environment variables with graceful fallbacks
 */

export const envConfig = {
  jira: {
    get baseUrl() {
      const customUrl = typeof window !== 'undefined' ? localStorage.getItem('jira_custom_base_url') : null;
      if (customUrl && (customUrl.includes('hsynornek') || customUrl.includes('your-domain'))) {
        localStorage.setItem('jira_custom_base_url', 'https://turkuvaz-jira.atlassian.net');
        return 'https://turkuvaz-jira.atlassian.net';
      }
      return (customUrl || import.meta.env.VITE_JIRA_BASE_URL || 'https://turkuvaz-jira.atlassian.net').replace(/\/+$/, '');
    },
    defaultTeam: import.meta.env.VITE_DEFAULT_TEAM || 'Search',
    autoLabel: import.meta.env.VITE_AUTO_LABEL || 'otomasyon_ai',
    get mpTeamFieldId() {
      const customField = typeof window !== 'undefined' ? localStorage.getItem('jira_mp_team_field_id') : null;
      return customField || import.meta.env.VITE_JIRA_MP_TEAM_FIELD_ID || '';
    },
  },
  isDevelopment: import.meta.env.DEV,
};
