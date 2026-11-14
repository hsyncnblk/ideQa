/**
 * Vercel Serverless Function: /api/jira
 *
 * Proxies Jira REST API requests to bypass CORS on production (e.g. Vercel)
 * and allows dynamic target Jira site URL via headers or query parameters.
 */

function isValidTargetUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Atlassian-Token, x-jira-target-url');
    return res.status(200).end();
  }

  // Hedef Jira Base URL (İstemciden header ile veya sunucu env'sinden gelebilir)
  const targetBaseUrl = (
    req.headers['x-jira-target-url'] ||
    process.env.VITE_JIRA_BASE_URL ||
    ''
  ).replace(/\/+$/, '');

  if (!targetBaseUrl || !isValidTargetUrl(targetBaseUrl)) {
    return res.status(400).json({ error: 'Geçersiz veya eksik Jira hedef URL.' });
  }

  // İstek yolu (/api/jira sonrasındaki path veya query param)
  let subPath = req.query.path || '';
  if (!subPath && req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    subPath = parsed.searchParams.get('path') || '';
  }

  if (!subPath) {
    return res.status(400).json({ error: 'Eksik Jira path parametresi.' });
  }

  // SSRF ve path traversal koruması: Sadece geçerli Jira REST / Secure attachment uç noktalarına izin ver
  const normalizedPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  const isAllowedPath = 
    normalizedPath.startsWith('/rest/api/2/') ||
    normalizedPath.startsWith('/rest/api/3/') ||
    normalizedPath.startsWith('/secure/attachment/');

  if (!isAllowedPath || normalizedPath.includes('..')) {
    return res.status(403).json({ error: 'İzin verilmeyen API yolu.' });
  }

  const destinationUrl = `${targetBaseUrl}${normalizedPath}`;

  const headers = {};
  if (req.headers['authorization']) {
    headers['Authorization'] = req.headers['authorization'];
  }
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }
  if (req.headers['x-atlassian-token']) {
    headers['X-Atlassian-Token'] = req.headers['x-atlassian-token'];
  }
  headers['Accept'] = 'application/json';
  // Jira XSRF korumasını sağlamak için Origin ve Referer ezilir
  headers['Origin'] = targetBaseUrl;
  headers['Referer'] = `${targetBaseUrl}/`;

  try {
    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      body = typeof req.body === 'object' && req.headers['content-type']?.includes('application/json')
        ? JSON.stringify(req.body)
        : req.body;
    }

    const upstream = await fetch(destinationUrl, {
      method: req.method,
      headers,
      body,
    });

    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json(data);
    } else {
      const buffer = await upstream.arrayBuffer();
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      return res.status(upstream.status).send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error('Jira proxy error:', err);
    return res.status(502).json({ error: 'Jira sunucusuna erişilemedi: ' + err.message });
  }
}
