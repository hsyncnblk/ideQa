/**
 * @module core/ErrorHandler
 * 
 * Centralized error classes and handling utilities.
 * All service/API errors are represented as typed, manageable error objects
 * instead of being silently swallowed.
 */

// ── Typed Error Classes ───────────────────────────────────────────────────────

export class AppError extends Error {
  /** @param {string} message  @param {string} code  @param {object} [meta] */
  constructor(message, code = 'APP_ERROR', meta = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.meta = meta;
  }
}

export class JiraApiError extends AppError {
  /** @param {string} message  @param {number} httpStatus  @param {string} [responseBody] */
  constructor(message, httpStatus = 0, responseBody = '') {
    super(message, 'JIRA_API_ERROR', { httpStatus, responseBody });
    this.name = 'JiraApiError';
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }
}

export class GeminiApiError extends AppError {
  /** @param {string} message  @param {number} httpStatus  @param {string} [responseBody] */
  constructor(message, httpStatus = 0, responseBody = '') {
    super(message, 'GEMINI_API_ERROR', { httpStatus, responseBody });
    this.name = 'GeminiApiError';
    this.httpStatus = httpStatus;
  }
}

export class ValidationError extends AppError {
  /** @param {string} message  @param {string} [fieldKey] */
  constructor(message, fieldKey = '') {
    super(message, 'VALIDATION_ERROR', { fieldKey });
    this.name = 'ValidationError';
    this.fieldKey = fieldKey;
  }
}

// ── HTTP Status → User-Friendly Turkish Message Map ───────────────────────────

const JIRA_ERROR_MESSAGES = {
  401: 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.',
  403: 'Bu işlem için yetkiniz bulunmuyor.',
  404: 'Aradığınız kayıt bulunamadı. Numarayı kontrol edin.',
  409: 'Çakışma hatası. Kayıt zaten mevcut olabilir.',
  429: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.',
};

const GEMINI_ERROR_MESSAGES = {
  400: 'Geçersiz istek. Lütfen girdileri kontrol edin.',
  401: 'Gemini API anahtarı geçersiz. Lütfen .env dosyasını kontrol edin.',
  403: 'Gemini API erişim yetkisi yok.',
  429: 'Gemini API istek limiti aşıldı. Lütfen biraz bekleyip tekrar deneyin.',
  500: 'Gemini sunucu hatası. Lütfen tekrar deneyin.',
};

// ── Central Error Handler ─────────────────────────────────────────────────────

/**
 * Converts any error into a user-friendly Turkish message string.
 * @param {Error} error
 * @returns {string}
 */
export function getUserFriendlyMessage(error) {
  if (error instanceof JiraApiError) {
    return JIRA_ERROR_MESSAGES[error.httpStatus] 
      || error.message 
      || `Jira bağlantı hatası (HTTP ${error.httpStatus})`;
  }

  if (error instanceof GeminiApiError) {
    return GEMINI_ERROR_MESSAGES[error.httpStatus]
      || error.message
      || `Gemini API hatası (HTTP ${error.httpStatus})`;
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  // Generic fallback
  return error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}

/**
 * Logs error details to console (development) without silently swallowing.
 * @param {string} context - Where the error occurred (e.g. 'jiraService.createStory')
 * @param {Error} error
 */
export function logError(context, error) {
  console.error(`[${context}]`, {
    name: error.name,
    message: error.message,
    code: error instanceof AppError ? error.code : 'UNKNOWN',
    meta: error instanceof AppError ? error.meta : {},
    stack: error.stack,
  });
}
