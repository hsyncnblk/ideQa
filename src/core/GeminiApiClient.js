/**
 * @module core/GeminiApiClient
 * 
 * Multi-provider client for Generative AI (Gemini and Claude).
 * Calls /api/ai and passes the active provider and token from localStorage.
 */

import { GeminiApiError, logError } from './ErrorHandler';
import { getAiConfig } from './aiConfig';

class GeminiApiClient {
  /**
   * Calls /api/ai backend proxy with given parts and config.
   *
   * @param {Array<object>} parts - Content parts (text, inlineData, etc.)
   * @param {object} [generationConfig] - Optional generation config overrides
   * @returns {Promise<string>} Raw text from candidate
   * @throws {GeminiApiError}
   */
  async generateContent(parts, generationConfig = { responseMimeType: 'application/json' }) {
    const aiConfig = getAiConfig();
    const token = aiConfig.activeToken;
    const provider = aiConfig.provider;

    let response;
    try {
      response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-token': token || '',
        },
        body: JSON.stringify({
          provider,
          token,
          parts,
          generationConfig,
        }),
      });
    } catch (networkError) {
      logError('GeminiApiClient.generateContent', networkError);
      throw new GeminiApiError(
        'AI servisine bağlanılamadı. İnternet bağlantınızı kontrol edin.',
        0
      );
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errText = errData.error || `HTTP ${response.status}`;
      logError('GeminiApiClient.generateContent', new Error(errText));
      throw new GeminiApiError(
        `AI Hatası: ${errText}`,
        response.status
      );
    }

    const data = await response.json();
    const resultText = data.text;

    if (!resultText) {
      throw new GeminiApiError('Yapay zeka boş bir sonuç döndürdü.', 200);
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
        `Yapay zeka beklenen JSON formatında ${contextLabel} şeması üretemedi. Lütfen tekrar deneyin.`,
        200
      );
    }
  }
}

/** Singleton instance */
export const geminiApiClient = new GeminiApiClient();
