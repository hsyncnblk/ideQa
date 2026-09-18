/**
 * @module core/GeminiApiClient
 * 
 * Single-responsibility HTTP client for Google Gemini Generative AI API.
 * Centralizes: API key validation, endpoint construction, response parsing,
 * and JSON cleaning (removing markdown ```json fences).
 */

import { envConfig } from '../config/envConfig';
import { GeminiApiError, logError } from './ErrorHandler';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

class GeminiApiClient {
  /**
   * Validates that a Gemini API key is configured.
   * @throws {GeminiApiError}
   */
  _validateApiKey() {
    const apiKey = envConfig.gemini.apiKey;
    if (!apiKey || apiKey.includes('your_gemini_api_key_here')) {
      throw new GeminiApiError(
        'Gemini API Anahtarı eksik veya geçersiz. Lütfen .env dosyasını kontrol edin.',
        401
      );
    }
  }

  /**
   * Calls the Gemini generateContent endpoint with given parts and config.
   * Handles response parsing, error mapping, and JSON cleaning.
   *
   * @param {Array<object>} parts - Content parts (text, inlineData, etc.)
   * @param {object} [generationConfig] - Optional generation config overrides
   * @returns {Promise<string>} Raw text from the first candidate
   * @throws {GeminiApiError}
   */
  async generateContent(parts, generationConfig = { responseMimeType: 'application/json' }) {
    this._validateApiKey();

    const apiKey = envConfig.gemini.apiKey;
    const model = envConfig.gemini.model;
    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig,
        }),
      });
    } catch (networkError) {
      logError('GeminiApiClient.generateContent', networkError);
      throw new GeminiApiError(
        'Gemini API\'ye bağlanılamadı. İnternet bağlantınızı kontrol edin.',
        0
      );
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      logError('GeminiApiClient.generateContent', new Error(`HTTP ${response.status}: ${errText}`));
      throw new GeminiApiError(
        `Gemini API Hatası: ${response.status}`,
        response.status,
        errText
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new GeminiApiError('Gemini boş bir sonuç döndürdü.', 200);
    }

    return resultText;
  }

  /**
   * Calls generateContent and parses the result as JSON.
   * Handles markdown code fence cleaning (```json ... ```) automatically.
   *
   * @param {Array<object>} parts - Content parts
   * @param {string} contextLabel - Label for error messages (e.g. 'Story', 'IPK', 'Bug')
   * @returns {Promise<object>} Parsed JSON object
   * @throws {GeminiApiError}
   */
  async generateJson(parts, contextLabel = 'AI') {
    const rawText = await this.generateContent(parts);

    try {
      const cleanText = rawText
        .replace(/```json/gi, '')
        .replace(/```/gi, '')
        .trim();
      return JSON.parse(cleanText);
    } catch (parseError) {
      logError(`GeminiApiClient.generateJson[${contextLabel}]`, parseError);
      throw new GeminiApiError(
        `Gemini beklenen JSON formatında ${contextLabel} şeması üretemedi. Lütfen tekrar deneyin.`,
        200
      );
    }
  }
}

/** Singleton instance */
export const geminiApiClient = new GeminiApiClient();
