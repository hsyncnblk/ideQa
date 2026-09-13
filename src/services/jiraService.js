import { envConfig } from '../config/envConfig';
import { FIXED_AUTOMATION_LABEL, DEFAULT_USER } from '../constants/jiraConstants';
import { generateSubtaskKey } from '../utils/formatters';

/**
 * Service to simulate and manage Jira REST API interactions
 */
export const jiraService = {
  /**
   * Validates Jira credentials by calling /rest/api/2/myself
   * Uses Atlassian Cloud Basic Auth (email:apiToken)
   * 
   * @param {string} email - Atlassian account email
   * @param {string} token - Jira API Token
   * @returns {Promise<Object>} User info { displayName, emailAddress, accountId }
   */
  async validateToken(email, token) {
    // Development'ta Vite proxy kullan, production'da doğrudan Jira URL
    const apiBase = envConfig.isDevelopment
      ? '/jira-api'
      : envConfig.jira.baseUrl.replace(/\/+$/, '');

    // Atlassian Cloud Basic Auth: base64(email:apiToken)
    const credentials = btoa(`${email}:${token}`);

    const response = await fetch(`${apiBase}/rest/api/2/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Geçersiz e-posta veya token. Lütfen kontrol edin.');
      }
      throw new Error(`Jira bağlantı hatası (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      displayName: data.displayName,
      emailAddress: data.emailAddress || email,
      accountId: data.accountId || data.key || '',
    };
  },

  /**
   * Fetches a Jira issue by key
   * Uses stored credentials from localStorage
   * 
   * @param {string} issueKey - e.g. "PROJ-123"
   * @returns {Promise<Object>} Issue info { key, summary, description, status, type }
   */
  async fetchStory(issueKey) {
    const apiBase = envConfig.isDevelopment
      ? '/jira-api'
      : envConfig.jira.baseUrl.replace(/\/+$/, '');

    const email = localStorage.getItem('jira_email') || '';
    const token = localStorage.getItem('jira_token') || '';
    const credentials = btoa(`${email}:${token}`);

    const response = await fetch(`${apiBase}/rest/api/2/issue/${issueKey}?fields=summary,description,status,issuetype`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`"${issueKey}" bulunamadı. Story numarasını kontrol edin.`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Jira hatası (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      key: data.key,
      summary: data.fields?.summary || '',
      description: data.fields?.description || '',
      status: data.fields?.status?.name || '',
      type: data.fields?.issuetype?.name || '',
    };
  },

  /**
   * Creates multiple subtasks in Jira, one for each selected platform
   * Title format strictly follows: `Test [Platform] - [Story No]`
   * 
   * @param {Object} params
   * @param {string} params.storyKey - e.g. "PROJ-123"
   * @param {Array<string>} params.selectedPlatforms - e.g. ["App", "BE", "FE"]
   * @param {string} params.team - e.g. "Team Alpha"
   * @param {string} params.author - e.g. "Hüseyin Ç."
   * @returns {Promise<Object>} Created subtasks array, summary, and formatted message
   */
  async createBulkPlatformSubtasks({ storyKey, storySummary, selectedPlatforms = ['FE'], scenarios = {}, team, author = DEFAULT_USER }) {
    const apiBase = envConfig.isDevelopment
      ? '/jira-api'
      : envConfig.jira.baseUrl.replace(/\/+$/, '');

    const email = localStorage.getItem('jira_email') || '';
    const token = localStorage.getItem('jira_token') || '';
    const accountId = localStorage.getItem('jira_account_id') || '';
    const credentials = btoa(`${email}:${token}`);

    const createdSubtasks = [];

    // Her platform için Jira'ya ayrı bir subtask oluşturma isteği atıyoruz
    for (const platform of selectedPlatforms) {
      const title = storySummary ? `Test ${platform} - ${storySummary}` : `Test ${platform} - ${storyKey}`;
      
      // Sadece seçili senaryoları description'a ekle
      const platformData = scenarios[platform];
      let descriptionText = '';
      if (platformData) {
        if (platformData.positive?.selected) descriptionText += platformData.positive.content + '\n\n';
        if (platformData.negative?.selected) descriptionText += platformData.negative.content + '\n\n';
      }

      const projectKey = storyKey.includes('-') ? storyKey.split('-')[0] : 'MP';

      const payload = {
        fields: {
          project: {
            key: projectKey
          },
          parent: {
            key: storyKey
          },
          summary: title,
          description: descriptionText.trim() || 'Senaryo içeriği boş.',
          issuetype: {
            name: 'Subtask' 
          },
          // Raporlayan ve Atanan kişi oturum açan kişi olacak
          ...(accountId ? {
            reporter: { id: accountId },
            assignee: { id: accountId }
          } : {})
        }
      };

      const response = await fetch(`${apiBase}/rest/api/2/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Atlassian-Token': 'no-check'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Subtask oluşturulamadı (${platform}):`, errorText);
        throw new Error(`Jira Subtask oluşturma hatası: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      createdSubtasks.push({
        id: data.key,
        parentKey: storyKey,
        platform: platform,
        title: title,
        team: team,
        label: FIXED_AUTOMATION_LABEL,
        status: 'To Do',
        createdAt: 'Az önce',
        author: author,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${data.key}`,
      });
    }

    const count = createdSubtasks.length;
    const platformList = selectedPlatforms.join(', ');
    const message = `${storyKey} için ${count} adet subtask (${platformList}) başarıyla oluşturuldu. (Etiket: ${FIXED_AUTOMATION_LABEL})`;

    return {
      success: true,
      subtasks: createdSubtasks,
      count,
      platforms: selectedPlatforms,
      message,
    };
  },

  /**
   * Fetches the most recently created subtasks by the automation tool.
   * Uses JQL to query issues created by the logged in user with the specific issue type or label.
   */
  async fetchRecentSubtasks() {
    const apiBase = envConfig.isDevelopment
      ? '/jira-api'
      : envConfig.jira.baseUrl.replace(/\/+$/, '');

    const email = localStorage.getItem('jira_email') || '';
    const token = localStorage.getItem('jira_token') || '';
    const credentials = btoa(`${email}:${token}`);

    // Get subtasks created by the current user, or just recent subtasks. 
    // We'll search for issuetype = Subtask OR issuetype = Sub-task ordered by created.
    // Also we can filter by reporter = currentUser() if we want it to be user specific.
    const jql = `issuetype in (Subtask, "Sub-task", "Alt Görev") AND reporter = currentUser() ORDER BY created DESC`;
    
    const response = await fetch(`${apiBase}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=10&fields=summary,status,created,parent,creator`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Recent subtasks could not be fetched', response.status);
      return []; // Silently fallback to empty list
    }

    const data = await response.json();
    
    return (data.issues || []).map(issue => {
      // created format "2026-09-13T17:00:00.000+0300"
      const date = new Date(issue.fields.created);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      let timeAgo = 'Az önce';
      if (diffMins > 60) {
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs > 24) timeAgo = `${Math.floor(diffHrs / 24)} gün önce`;
        else timeAgo = `${diffHrs} saat önce`;
      } else if (diffMins > 0) {
        timeAgo = `${diffMins} dakika önce`;
      }

      return {
        id: issue.key,
        parentKey: issue.fields.parent?.key || 'N/A',
        title: issue.fields.summary,
        team: 'My Software Team', // Since we don't store team per ticket right now easily, we can hardcode or leave generic
        label: FIXED_AUTOMATION_LABEL,
        status: issue.fields.status?.name || 'To Do',
        createdAt: timeAgo,
        author: issue.fields.creator?.displayName || DEFAULT_USER,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${issue.key}`,
      };
    });
  }
};
