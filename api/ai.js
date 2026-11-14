/**
 * Vercel Serverless Function: /api/ai
 *
 * Supports both Google Gemini and Anthropic Claude dynamically.
 * Accepts user-provided tokens in request headers or body,
 * falling back to server environment variables if available.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { provider = 'gemini', parts, generationConfig, prompt: directPrompt } = req.body;

    const userToken = req.headers['x-ai-token'] || req.body.token;

    if (provider === 'claude') {
      const apiKey = userToken || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'Claude API Token bulunamadı. Lütfen token girin.' });
      }

      // Convert Gemini parts format to Claude messages
      let promptText = directPrompt || '';
      const contentParts = [];

      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part.text) {
            contentParts.push({ type: 'text', text: part.text });
          } else if (part.inlineData) {
            contentParts.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: part.inlineData.mimeType || 'image/png',
                data: part.inlineData.data,
              },
            });
          }
        }
      }

      const claudePayload = {
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: contentParts.length > 0 ? contentParts : (promptText || 'Merhaba'),
          },
        ],
      };

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(claudePayload),
      });

      if (!upstream.ok) {
        const errData = await upstream.json().catch(() => ({}));
        return res.status(upstream.status).json({
          error: `Claude API Hatası: ${errData.error?.message || upstream.statusText}`,
        });
      }

      const data = await upstream.json();
      const text = data.content?.[0]?.text || '';
      return res.status(200).json({ text });
    }

    // Default: Gemini
    const apiKey = userToken || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const model = process.env.VITE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Anahtarı bulunamadı. Lütfen token girin.' });
    }

    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Geçersiz istek gövdesi. "parts" dizisi bekleniyor.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: generationConfig || { responseMimeType: 'application/json' },
      }),
    });

    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({}));
      const errText = errData.error?.message || `HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: `Gemini API Hatası: ${errText}` });
    }

    const data = await upstream.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(200).json({ error: 'Gemini boş sonuç döndürdü.' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('AI Proxy error:', err);
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}

