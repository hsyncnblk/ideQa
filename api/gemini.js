/**
 * Vercel Serverless Function: /api/gemini
 *
 * Secures Gemini API Key on server-side.
 * Browser never sees the GEMINI_API_KEY.
 */

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ortam değişkenlerinden anahtarı güvenle al
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.VITE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    return res.status(500).json({ error: 'Sunucu tarafında Gemini API anahtarı yapılandırılmamış.' });
  }

  try {
    const { parts, generationConfig } = req.body;

    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Geçersiz istek gövdesi. "parts" dizisi bekleniyor.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: generationConfig || { responseMimeType: 'application/json' },
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({
        error: `Gemini API Hatası: ${upstream.status}`,
        details: errText,
      });
    }

    const data = await upstream.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return res.status(200).json({ error: 'Gemini boş sonuç döndürdü.' });
    }

    return res.status(200).json({ text: resultText });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}

