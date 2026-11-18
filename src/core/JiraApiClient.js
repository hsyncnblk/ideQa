/**
 * @module core/JiraApiClient
 * 
 * Single-responsibility HTTP client for all Jira REST API calls.
 * Centralizes: apiBase resolution, Basic Auth credentials, header management,
 * and HTTP error handling.
 */

import { envConfig } from '../config/envConfig';
import { JiraApiError, logError, extractJiraErrorMessages } from './ErrorHandler';

class JiraApiClient {
  /**
   * Resolves the base URL for Jira API.
   * In development or production (Vercel): uses /api/jira proxy to bypass CORS.
   * If local dev proxy configured for /jira-api, it works seamlessly.
   * @returns {string}
   */
  get apiBase() {
    return '/api/jira';
  }

  /**
   * Reads stored credentials and target Jira URL from localStorage.
   * @returns {{ credentials: string, email: string, token: string, accountId: string, jiraUrl: string }}
   */
  getAuth() {
    const email = localStorage.getItem('jira_email') || '';
    const token = localStorage.getItem('jira_token') || '';
    const accountId = localStorage.getItem('jira_account_id') || '';
    const jiraUrl = envConfig.jira.baseUrl;
    const credentials = btoa(`${email}:${token}`);
    return { credentials, email, token, accountId, jiraUrl };
  }

  /**
   * Builds request URL, handling Vercel serverless proxy path parameter if in production.
   * @param {string} path - e.g. /rest/api/2/myself
   * @returns {string}
   */
  _buildUrl(path) {
    if (this.apiBase === '/api/jira') {
      return `/api/jira?path=${encodeURIComponent(path)}`;
    }
    return `${this.apiBase}${path}`;
  }

  /**
   * Builds default headers for requests.
   * @param {string} credentials - Base64 auth string
   * @param {boolean} [includeAtlassianToken=false]
   * @returns {object}
   */
  _jsonHeaders(credentials, includeAtlassianToken = false) {
    const { jiraUrl } = this.getAuth();
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-jira-target-url': jiraUrl,
    };
    if (includeAtlassianToken) {
      headers['X-Atlassian-Token'] = 'no-check';
    }
    return headers;
  }

  /**
   * Performs a GET request against Jira REST API.
   * @param {string} path - API path (e.g. '/rest/api/2/myself')
   * @param {string} [overrideCredentials] - Optional explicit credentials (for login validation)
   * @param {string} [overrideTargetUrl] - Optional target URL for login check
   * @returns {Promise<any>} Parsed JSON response
   * @throws {JiraApiError}
   */
  async get(path, overrideCredentials = null, overrideTargetUrl = null) {
    const { credentials, jiraUrl } = this.getAuth();
    const authToken = overrideCredentials || credentials;
    const targetUrl = overrideTargetUrl || jiraUrl;

    const response = await fetch(this._buildUrl(path), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json',
        'x-jira-target-url': targetUrl,
      },
    });

    if (!response.ok) {
      await this._handleHttpError(response, `GET ${path}`);
    }

    return response.json();
  }

  /**
   * Performs a POST request with JSON body against Jira REST API.
   * @param {string} path
   * @param {object} body
   * @returns {Promise<any>} Parsed JSON response
   * @throws {JiraApiError}
   */
  async post(path, body) {
    const { credentials } = this.getAuth();

    const response = await fetch(this._buildUrl(path), {
      method: 'POST',
      headers: this._jsonHeaders(credentials, true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const extracted = extractJiraErrorMessages(errorText);
      const friendlyMsg = extracted.length > 0 
        ? extracted.join('\n') 
        : `Jira API hatası: ${response.status}`;
      throw new JiraApiError(
        friendlyMsg,
        response.status,
        errorText
      );
    }

    return response.json();
  }

  /**
   * Performs a PUT request with JSON body against Jira REST API.
   * @param {string} path
   * @param {object} body
   * @returns {Promise<any>}
   * @throws {JiraApiError}
   */
  async put(path, body) {
    const { credentials } = this.getAuth();

    const response = await fetch(this._buildUrl(path), {
      method: 'PUT',
      headers: this._jsonHeaders(credentials, true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const extracted = extractJiraErrorMessages(errorText);
      const friendlyMsg = extracted.length > 0 
        ? extracted.join('\n') 
        : `Jira API hatası: ${response.status}`;
      throw new JiraApiError(
        friendlyMsg,
        response.status,
        errorText
      );
    }

    if (response.status === 204) return { success: true };
    return response.json();
  }

  /**
   * Performs a multipart/form-data POST (for file attachments).
   * @param {string} path
   * @param {FormData} formData
   * @returns {Promise<Response>}
   * @throws {JiraApiError}
   */
  async postForm(path, formData) {
    const { credentials, jiraUrl } = this.getAuth();

    const response = await fetch(this._buildUrl(path), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'X-Atlassian-Token': 'no-check',
        'x-jira-target-url': jiraUrl,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new JiraApiError(
        `Dosya yükleme hatası: ${response.status}`,
        response.status
      );
    }

    return response;
  }

  /**
   * Fetches binary content (e.g., attachment) as a Blob.
   * @param {string} contentUrl - Full or relative URL
   * @returns {Promise<Blob>}
   * @throws {JiraApiError}
   */
  async getBlob(contentUrl) {
    const { credentials, jiraUrl } = this.getAuth();

    let fetchPath = contentUrl;
    const jiraBase = jiraUrl.replace(/\/+$/, '');
    if (contentUrl.startsWith(jiraBase)) {
      fetchPath = contentUrl.replace(jiraBase, '');
    }

    const response = await fetch(this._buildUrl(fetchPath), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'x-jira-target-url': jiraUrl,
      },
    });

    if (!response.ok) {
      throw new JiraApiError(
        `Ek dosya indirilemedi: ${response.status}`,
        response.status
      );
    }

    return response.blob();
  }

  /**
   * Handles non-OK HTTP responses by throwing typed errors.
   * @param {Response} response
   * @param {string} context
   * @throws {JiraApiError}
   * @private
   */
  async _handleHttpError(response, context) {
    const errorText = await response.text().catch(() => '');
    const status = response.status;
    const extracted = extractJiraErrorMessages(errorText);

    const messages = {
      401: 'Geçersiz e-posta veya token. Lütfen kontrol edin.',
      403: 'Bu işlem için yetkiniz bulunmuyor.',
      404: 'Aradığınız kayıt bulunamadı. Numarayı kontrol edin.',
    };

    const message = extracted.length > 0
      ? extracted.join('\n')
      : (messages[status] || `Jira bağlantı hatası (HTTP ${status})`);
    logError(`JiraApiClient.${context}`, new Error(`${message} — ${errorText}`));
    throw new JiraApiError(message, status, errorText);
  }
}

/** Singleton instance */
export const jiraApiClient = new JiraApiClient();
