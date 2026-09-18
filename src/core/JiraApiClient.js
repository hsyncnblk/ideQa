/**
 * @module core/JiraApiClient
 * 
 * Single-responsibility HTTP client for all Jira REST API calls.
 * Centralizes: apiBase resolution, Basic Auth credentials, header management,
 * and HTTP error handling. Eliminates 8+ repeated credential blocks across jiraService.
 */

import { envConfig } from '../config/envConfig';
import { JiraApiError, logError } from './ErrorHandler';

class JiraApiClient {
  /**
   * Resolves the base URL for Jira API.
   * Uses Vite proxy in development, direct URL in production.
   * @returns {string}
   */
  get apiBase() {
    return envConfig.isDevelopment
      ? '/jira-api'
      : envConfig.jira.baseUrl.replace(/\/+$/, '');
  }

  /**
   * Reads stored credentials from localStorage and returns Base64-encoded auth string.
   * @returns {{ credentials: string, email: string, token: string, accountId: string }}
   */
  getAuth() {
    const email = localStorage.getItem('jira_email') || '';
    const token = localStorage.getItem('jira_token') || '';
    const accountId = localStorage.getItem('jira_account_id') || '';
    const credentials = btoa(`${email}:${token}`);
    return { credentials, email, token, accountId };
  }

  /**
   * Builds default headers for JSON requests.
   * @param {string} credentials - Base64 auth string
   * @param {boolean} [includeAtlassianToken=false]
   * @returns {object}
   */
  _jsonHeaders(credentials, includeAtlassianToken = false) {
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
   * @returns {Promise<any>} Parsed JSON response
   * @throws {JiraApiError}
   */
  async get(path, overrideCredentials = null) {
    const { credentials } = this.getAuth();
    const authToken = overrideCredentials || credentials;

    const response = await fetch(`${this.apiBase}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json',
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

    const response = await fetch(`${this.apiBase}${path}`, {
      method: 'POST',
      headers: this._jsonHeaders(credentials, true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new JiraApiError(
        `Jira API hatası: ${response.status}`,
        response.status,
        errorText
      );
    }

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
    const { credentials } = this.getAuth();

    const response = await fetch(`${this.apiBase}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'X-Atlassian-Token': 'no-check',
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
   * Handles dev proxy URL rewriting.
   * @param {string} contentUrl - Full or relative URL
   * @returns {Promise<Blob>}
   * @throws {JiraApiError}
   */
  async getBlob(contentUrl) {
    const { credentials } = this.getAuth();

    let fetchUrl = contentUrl;
    if (envConfig.isDevelopment) {
      const jiraBase = envConfig.jira.baseUrl.replace(/\/+$/, '');
      if (contentUrl.startsWith(jiraBase)) {
        fetchUrl = contentUrl.replace(jiraBase, '/jira-api');
      } else if (!contentUrl.startsWith('/jira-api') && contentUrl.startsWith('/')) {
        fetchUrl = `/jira-api${contentUrl}`;
      }
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
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

    const messages = {
      401: 'Geçersiz e-posta veya token. Lütfen kontrol edin.',
      403: 'Bu işlem için yetkiniz bulunmuyor.',
      404: 'Aradığınız kayıt bulunamadı. Numarayı kontrol edin.',
    };

    const message = messages[status] || `Jira bağlantı hatası (HTTP ${status})`;
    logError(`JiraApiClient.${context}`, new Error(`${message} — ${errorText}`));
    throw new JiraApiError(message, status, errorText);
  }
}

/** Singleton instance */
export const jiraApiClient = new JiraApiClient();
