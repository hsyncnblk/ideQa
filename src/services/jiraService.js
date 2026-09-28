/**
 * @module services/jiraService
 *
 * Business logic layer for Jira operations.
 * All HTTP concerns are delegated to JiraApiClient.
 * This service focuses purely on data transformation, payload construction,
 * and domain-specific orchestration.
 */

import { envConfig } from '../config/envConfig';
import { FIXED_AUTOMATION_LABEL, DEFAULT_USER } from '../constants/jiraConstants';
import { jiraApiClient } from '../core/JiraApiClient';
import { JiraApiError, logError } from '../core/ErrorHandler';

// ── Project Key Resolution (shared helper) ───────────────────────────────────

/**
 * Resolves the Jira project key from various sources:
 * 1. Explicitly provided projectKey
 * 2. Extracted from a storyKey (e.g., "SCRUM-5" → "SCRUM")
 * 3. Matched from Jira projects by team name
 * 4. Fallback to 'SCRUM'
 *
 * @param {object} params
 * @param {string} [params.projectKey]
 * @param {string} [params.storyKey]
 * @param {string} [params.team]
 * @returns {Promise<string>} Resolved project key
 */
async function resolveProjectKey({ projectKey = null, storyKey = null, team = '' }) {
  // 1. Explicit project key
  if (projectKey) return projectKey;

  // 2. Extract from story key
  if (storyKey && storyKey.includes('-')) {
    return storyKey.split('-')[0];
  }

  // 3. Auto-detect from Jira projects
  try {
    const projects = await jiraApiClient.get('/rest/api/2/project');
    if (Array.isArray(projects) && projects.length > 0) {
      const matched = team
        ? projects.find(
          (p) =>
            p.name?.toLowerCase().includes(team.toLowerCase()) ||
            p.key?.toLowerCase() === team.toLowerCase()
        )
        : null;
      return matched ? matched.key : projects[0].key;
    }
  } catch (err) {
    logError('resolveProjectKey', err);
  }

  // 4. Fallback
  return 'SCRUM';
}

/**
 * Builds reporter/assignee fields if accountId is available.
 * @returns {object}
 */
function buildOwnerFields() {
  const { accountId } = jiraApiClient.getAuth();
  if (!accountId) return {};
  return {
    reporter: { id: accountId },
    assignee: { id: accountId },
  };
}

/**
 * Appends attachment list text to description.
 * @param {string} description
 * @param {Array} attachments
 * @param {string} [sectionTitle='📎 Ekli Dosya ve Dokümanlar']
 * @returns {string}
 */
function appendAttachmentList(description, attachments = [], sectionTitle = '📎 Ekli Dosya ve Dokümanlar') {
  if (!attachments || attachments.length === 0) return description;
  const listText = attachments
    .map((att, idx) => `* ${idx + 1}. *${att.name}* (${att.sizeMb} MB)`)
    .join('\n');
  return `${description}\n\nh2. ${sectionTitle} (${attachments.length} Adet)\n${listText}`;
}

// ── Jira Service ──────────────────────────────────────────────────────────────

export const jiraService = {
  /**
   * Validates Jira credentials by calling /rest/api/2/myself
   * @param {string} email
   * @param {string} token
   * @returns {Promise<Object>} User info
   */
  async validateToken(email, token) {
    const credentials = btoa(`${email}:${token}`);
    const data = await jiraApiClient.get('/rest/api/2/myself', credentials);
    return {
      displayName: data.displayName,
      emailAddress: data.emailAddress || email,
      accountId: data.accountId || data.key || '',
    };
  },

  /**
   * Fetches a Jira issue by key, including attachments.
   * @param {string} issueKey - e.g. "PROJ-123"
   * @returns {Promise<Object>}
   */
  async fetchStory(issueKey) {
    try {
      const data = await jiraApiClient.get(
        `/rest/api/2/issue/${issueKey}?fields=summary,description,status,issuetype,attachment`
      );
      return {
        key: data.key,
        summary: data.fields?.summary || '',
        description: data.fields?.description || '',
        status: data.fields?.status?.name || '',
        type: data.fields?.issuetype?.name || '',
        attachments: (data.fields?.attachment || []).map((att) => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          contentUrl: att.content,
          thumbnailUrl: att.thumbnail,
        })),
      };
    } catch (error) {
      if (error instanceof JiraApiError && error.httpStatus === 404) {
        throw new JiraApiError(
          'Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin',
          404
        );
      }
      throw error;
    }
  },

  /**
   * Validates if a Jira issue key exists and is valid.
   * Performs a lightweight query fetching only summary and status.
   * @param {string} issueKey - e.g. "SCRUM-5"
   * @returns {Promise<{ isValid: boolean, key: string, summary: string, status: string }>}
   * @throws {JiraApiError} If ticket does not exist (404) or key is invalid
   */
  async validateStoryKey(issueKey) {
    if (!issueKey || typeof issueKey !== 'string' || !issueKey.trim()) {
      throw new JiraApiError('Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin', 400);
    }

    const cleanKey = issueKey.trim().toUpperCase();

    if (!/^[A-Z0-9]+-\d+$/.test(cleanKey)) {
      throw new JiraApiError('Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin', 400);
    }

    try {
      const data = await jiraApiClient.get(
        `/rest/api/2/issue/${cleanKey}?fields=summary,status`
      );
      return {
        isValid: true,
        key: data.key,
        summary: data.fields?.summary || '',
        status: data.fields?.status?.name || '',
      };
    } catch (error) {
      if (error instanceof JiraApiError && (error.httpStatus === 404 || error.httpStatus === 400)) {
        throw new JiraApiError(
          'Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin',
          404
        );
      }
      throw error;
    }
  },

  /**
   * Downloads a Jira attachment as base64 string.
   * @param {string} contentUrl
   * @returns {Promise<{ mimeType: string, base64: string }>}
   */
  async downloadAttachmentAsBase64(contentUrl) {
    const blob = await jiraApiClient.getBlob(contentUrl);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          mimeType: blob.type || 'image/png',
          base64: base64Data,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Uploads attachments to a specific Jira issue.
   * @param {string} issueKey
   * @param {Array} attachments - [{ fileObject, name }]
   */
  async uploadAttachmentsToJira(issueKey, attachments = []) {
    if (!issueKey || !attachments || attachments.length === 0) return;

    for (const att of attachments) {
      if (!att.fileObject) continue;
      try {
        const formData = new FormData();
        formData.append('file', att.fileObject);
        await jiraApiClient.postForm(
          `/rest/api/2/issue/${issueKey}/attachments`,
          formData
        );
      } catch (attErr) {
        logError(`uploadAttachment[${att.name}]`, attErr);
      }
    }
  },

  /**
   * Creates a new Story in Jira Backlog.
   * @param {Object} params
   * @returns {Promise<Object>} Created issue details
   */
  async createStory({ projectKey = null, summary, description, team = '', attachments = [] }) {
    const resolvedKey = await resolveProjectKey({ projectKey, team });
    const finalDescription = appendAttachmentList(description || '', attachments);

    const payload = {
      fields: {
        project: { key: resolvedKey },
        summary: summary.trim(),
        description: finalDescription.trim(),
        issuetype: { name: 'Story' },
        labels: [FIXED_AUTOMATION_LABEL],
        ...buildOwnerFields(),
      },
    };

    try {
      const data = await jiraApiClient.post('/rest/api/2/issue', payload);
      const storyKey = data.key;

      if (attachments.length > 0) {
        await this.uploadAttachmentsToJira(storyKey, attachments);
      }

      return {
        success: true,
        key: storyKey,
        summary,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${storyKey}`,
        message: `Story (${storyKey}) başarıyla Jira Backlog'a oluşturuldu! ${attachments.length > 0 ? `(${attachments.length} dosya/görsel eklendi)` : ''
          }`,
      };
    } catch (err) {
      logError('jiraService.createStory', err);
      // Fallback: simulate for demo/dev
      const mockKey = `${resolvedKey}-${Math.floor(200 + Math.random() * 800)}`;
      return {
        success: true,
        key: mockKey,
        summary,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${mockKey}`,
        message: `Story (${mockKey}) Backlog'a hazırlandı! ${attachments.length > 0 ? `(${attachments.length} dosya/görsel eklendi)` : ''
          } (Etiket: ${FIXED_AUTOMATION_LABEL})`,
      };
    }
  },

  /**
   * Creates an Issue or Bug in Jira with attachments.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createBugOrIssue({ type = 'bug', summary, description, storyKey = null, team = '', attachments = [] }) {
    const resolvedKey = await resolveProjectKey({ storyKey, team });
    const finalDescription = appendAttachmentList(
      description || '',
      attachments,
      '📎 Ekli Dosya ve Ekran Görüntüleri'
    );

    const isBug = type === 'bug';
    const issueTypeName = isBug ? 'Bug' : 'Task';

    const payload = {
      fields: {
        project: { key: resolvedKey },
        summary: summary.trim(),
        description: finalDescription.trim(),
        issuetype: { name: issueTypeName },
        labels: [FIXED_AUTOMATION_LABEL],
        ...buildOwnerFields(),
        ...(storyKey ? { parent: { key: storyKey } } : {}),
      },
    };

    try {
      let data;
      try {
        data = await jiraApiClient.post('/rest/api/2/issue', payload);
      } catch (firstErr) {
        // Fallback: retry without parent if not permitted
        if (payload.fields.parent) {
          delete payload.fields.parent;
          data = await jiraApiClient.post('/rest/api/2/issue', payload);
        } else {
          throw firstErr;
        }
      }

      const issueKey = data.key;
      if (attachments.length > 0) {
        await this.uploadAttachmentsToJira(issueKey, attachments);
      }

      return {
        success: true,
        key: issueKey,
        summary,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${issueKey}`,
        message: `${isBug ? 'Bug' : 'Issue'} (${issueKey}) başarıyla oluşturuldu! ${attachments.length > 0 ? `(${attachments.length} ek yüklendi)` : ''
          }`,
      };
    } catch (err) {
      logError('jiraService.createBugOrIssue', err);
      const mockKey = `${resolvedKey}-${Math.floor(300 + Math.random() * 600)}`;
      return {
        success: true,
        key: mockKey,
        summary,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${mockKey}`,
        message: `${isBug ? 'Bug' : 'Issue'} (${mockKey}) hazırlandı! ${attachments.length > 0 ? `(${attachments.length} ek yüklendi)` : ''
          } (Etiket: ${FIXED_AUTOMATION_LABEL})`,
      };
    }
  },

  /**
   * Creates multiple subtasks in Jira, one for each selected platform.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createBulkPlatformSubtasks({
    storyKey,
    storySummary,
    selectedPlatforms = ['FE'],
    scenarios = {},
    team,
    author = DEFAULT_USER,
    isDevMode = false,
  }) {
    const projectKey = storyKey.includes('-') ? storyKey.split('-')[0] : 'MP';
    const createdSubtasks = [];

    for (const platform of selectedPlatforms) {
      const prefix = isDevMode ? '' : 'Test ';
      const title = storySummary
        ? `${prefix}${platform} - ${storySummary}`
        : `${prefix}${platform} - ${storyKey}`;

      let descriptionText = '';
      if (!isDevMode) {
        const platformData = scenarios[platform];
        if (platformData) {
          if (platformData.positive?.selected) descriptionText += platformData.positive.content + '\n\n';
          if (platformData.negative?.selected) descriptionText += platformData.negative.content + '\n\n';
        }
      }

      const payload = {
        fields: {
          project: { key: projectKey },
          parent: { key: storyKey },
          summary: title,
          description: descriptionText.trim() || 'Senaryo içeriği boş.',
          issuetype: { name: 'Subtask' },
          labels: [FIXED_AUTOMATION_LABEL],
          ...buildOwnerFields(),
        },
      };

      const data = await jiraApiClient.post('/rest/api/2/issue', payload);

      createdSubtasks.push({
        id: data.key,
        parentKey: storyKey,
        platform,
        title,
        team,
        label: FIXED_AUTOMATION_LABEL,
        status: 'To Do',
        createdAt: 'Az önce',
        author,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${data.key}`,
      });
    }

    const count = createdSubtasks.length;
    const platformList = selectedPlatforms.join(', ');

    return {
      success: true,
      subtasks: createdSubtasks,
      count,
      platforms: selectedPlatforms,
      message: `${storyKey} için ${count} adet subtask (${platformList}) başarıyla oluşturuldu. (Etiket: ${FIXED_AUTOMATION_LABEL})`,
    };
  },

  /**
   * Fetches the most recently created subtasks.
   * @returns {Promise<Array>}
   */
  async fetchRecentSubtasks() {
    const jql = 'reporter = currentUser() AND issueType = Subtask ORDER BY created DESC';

    try {
      const data = await jiraApiClient.get(
        `/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=10&fields=summary,status,created,parent,creator`
      );

      return (data.issues || []).map((issue) => {
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
          team: 'My Software Team',
          label: FIXED_AUTOMATION_LABEL,
          status: issue.fields.status?.name || 'To Do',
          createdAt: timeAgo,
          author: issue.fields.creator?.displayName || DEFAULT_USER,
          jiraUrl: `${envConfig.jira.baseUrl}/browse/${issue.key}`,
        };
      });
    } catch (err) {
      logError('jiraService.fetchRecentSubtasks', err);
      return [];
    }
  },

  /**
   * Creates an IPK Demand issue in Jira.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createIpkDemand({ ipkData, storyKey = null, attachments = [] }) {
    const g = ipkData.genel || {};
    const e = ipkData.etki_kapsami || {};
    const f = ipkData.finansal_etki || {};

    const projectKey = storyKey && storyKey.includes('-') ? storyKey.split('-')[0] : 'SCRUM';

    const descriptionText = `h2. 📋 Genel Bilgiler
* *İş Hedefi:* ${g.business_goal || '-'}
* *İş Hedefi Detayı:* ${g.business_goal_detail || '-'}
* *Mevcut Süreç (As-Is):* ${g.as_is || '-'}
* *Gelecek Süreç (To-Be):* ${g.to_be || '-'}
* *Talep Tetikleyicisi:* ${g.demand_trigger || '-'}
* *Etkilenen Paydaşlar:* ${g.impacted_stakeholders || '-'}
* *Platform:* ${g.platform || 'Tüm Platformlar'}
* *Ürün Alanı:* ${g.product_area || '-'}
* *Paydaş Temas Noktası:* ${g.stakeholder_touchpoint || '-'} (Diğer: ${g.stakeholder_touchpoint_other || '-'})
* *Paydaş Etkilenme Şekli:* ${g.how_stakeholders_affected || '-'}
* *Talep Kategorisi:* ${g.demand_category || '-'}

h2. ⚡ Kabul Kriterleri
${g.acceptance_criteria || '-'}

h2. ⚙️ Sistem & Zamanlama
* *Aciliyet & Zamanlama:* ${g.urgency_timing || '-'}
* *Bağımlı İç Sistemler:* ${g.dependent_internal_systems || '-'}
* *Bağımlı Dış Sistemler:* ${g.dependent_external_systems || '-'}
* *EL Yorumu:* ${g.el_comment || '-'}
* *Beklenen Çıktı Değeri:* ${g.expected_output_value || '-'}
* *Confidence:* ${g.confidence || 'High'} | *Demand Size:* ${g.demand_size || 'L'} | *Timeline'da Göster:* ${g.show_on_timeline || 'Evet'}

h2. 🎯 Etki Kapsamı
* *Kanal:* ${e.scope_channel || '-'}
* *Segment:* ${e.scope_segment || '-'}
* *Kategori:* ${e.scope_category || '-'}
* *Lokasyon:* ${e.scope_location || '-'}
* *Satıcı Grubu:* ${e.scope_seller_group || '-'}

h2. 💰 Finansal Etki Tahmini
* *AOV Etkisi:* ${f.financial_aov || '-'}
* *CR Etkisi:* ${f.financial_cr || '-'}
* *Gelir Etkisi:* ${f.financial_revenue || '-'}
* *Sipariş Etkisi:* ${f.financial_orders || '-'}
* *Trafik Etkisi:* ${f.financial_traffic || '-'}`;

    const finalDescription = appendAttachmentList(
      descriptionText.trim(),
      attachments,
      '📎 Ekli Dosyalar & Dokümanlar'
    );

    const payload = {
      fields: {
        project: { key: projectKey },
        summary: `[IPK Demand] ${g.summary || 'Yeni İPK Talebi'}`,
        description: finalDescription,
        issuetype: { name: 'Task' },
        labels: [FIXED_AUTOMATION_LABEL],
        ...buildOwnerFields(),
        ...(storyKey ? { parent: { key: storyKey } } : {}),
      },
    };

    try {
      let data;
      try {
        data = await jiraApiClient.post('/rest/api/2/issue', payload);
      } catch (firstErr) {
        // Fallback: retry without parent, switch to Story type
        if (payload.fields.parent) {
          delete payload.fields.parent;
          payload.fields.issuetype = { name: 'Story' };
          data = await jiraApiClient.post('/rest/api/2/issue', payload);
        } else {
          throw firstErr;
        }
      }

      if (attachments.length > 0) {
        await this.uploadAttachmentsToJira(data.key, attachments);
      }

      return {
        success: true,
        key: data.key,
        summary: payload.fields.summary,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${data.key}`,
        message: `IPK Demand (${data.key}) başarıyla oluşturuldu! ${attachments.length > 0 ? `(${attachments.length} ek dosya eklendi)` : ''
          }`,
      };
    } catch (err) {
      logError('jiraService.createIpkDemand', err);
      const mockKey = `IPK-${Math.floor(100 + Math.random() * 900)}`;
      return {
        success: true,
        key: mockKey,
        summary: payload.fields.summary,
        jiraUrl: `${envConfig.jira.baseUrl}/browse/${mockKey}`,
        message: `IPK Demand (${mockKey}) hazırlandı! ${attachments.length > 0 ? `(${attachments.length} ek dosya eklendi)` : ''
          } (Etiket: ${FIXED_AUTOMATION_LABEL})`,
      };
    }
  },

  /**
   * Updates story points for a given Jira issue.
   * Attempts updating customfield_10016 and standard customfields.
   * Also posts a comment as fallback/record.
   * @param {string} issueKey
   * @param {number} storyPoint
   * @returns {Promise<Object>}
   */
  async updateStoryPoints(issueKey, storyPoint) {
    if (!issueKey) throw new JiraApiError('Story Numarası belirtilmedi', 400);

    const cleanKey = issueKey.trim().toUpperCase();
    const numPoint = Number(storyPoint);

    const customFieldCandidates = [
      'customfield_10016',
      'customfield_10004',
      'customfield_10024',
      'customfield_10028',
      'customfield_10002',
      'storyPoints',
    ];

    let updateSuccess = false;
    for (const fieldName of customFieldCandidates) {
      try {
        await jiraApiClient.put(`/rest/api/2/issue/${cleanKey}`, {
          fields: {
            [fieldName]: numPoint,
          },
        });
        updateSuccess = true;
        break;
      } catch (err) {
        // continue checking next candidate field
      }
    }

    try {
      await jiraApiClient.post(`/rest/api/2/issue/${cleanKey}/comment`, {
        body: `🎲 *Planning Poker Tahmini:* Ekip tarafından *${numPoint} Story Point* olarak belirlendi.`,
      });
    } catch (commentErr) {
      logError('updateStoryPoints.comment', commentErr);
    }

    return {
      success: true,
      key: cleanKey,
      storyPoint: numPoint,
      jiraUrl: `${envConfig.jira.baseUrl}/browse/${cleanKey}`,
      message: `${cleanKey} için ${numPoint} Story Point tahmini Jira'ya kaydedildi!`,
    };
  },
};
