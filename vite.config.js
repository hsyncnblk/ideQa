import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function isValidTargetUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));
  } catch {
    return false;
  }
}

// Custom dev middleware for /api/ai, /api/gemini and /api/jira
function devApiProxyPlugin(env) {
  return {
    name: 'dev-api-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        // /api/ai and /api/gemini endpoint simülasyonu
        if ((url.pathname === '/api/ai' || url.pathname === '/api/gemini') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsedBody = JSON.parse(body || '{}');
              const { provider = 'gemini', parts, generationConfig } = parsedBody;
              const userToken = req.headers['x-ai-token'] || parsedBody.token;

              if (provider === 'claude') {
                const apiKey = userToken || env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY;
                if (!apiKey) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Claude API Token bulunamadı. Lütfen token girin.' }));
                  return;
                }

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

                const upstream = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                  },
                  body: JSON.stringify({
                    model: env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: contentParts }],
                  }),
                });

                const data = await upstream.json();
                res.statusCode = upstream.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text: data.content?.[0]?.text, error: data.error?.message }));
                return;
              }

              // Gemini
              const apiKey = userToken || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
              const model = env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Gemini API anahtarı bulunamadı. Lütfen token girin.' }));
                return;
              }

              const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
              const upstream = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts }],
                  generationConfig: generationConfig || { responseMimeType: 'application/json' },
                }),
              });

              const data = await upstream.json();
              const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

              res.statusCode = upstream.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text: resultText, error: data.error?.message }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // /api/jira endpoint simülasyonu
        if (url.pathname === '/api/jira') {
          const targetUrl = (
            req.headers['x-jira-target-url'] ||
            env.VITE_JIRA_BASE_URL ||
            ''
          ).replace(/\/+$/, '');

          if (!targetUrl || !isValidTargetUrl(targetUrl)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Geçersiz veya eksik Jira hedef URL.' }));
            return;
          }

          const subPath = url.searchParams.get('path') || '';
          const normalizedPath = subPath.startsWith('/') ? subPath : `/${subPath}`;

          const isAllowedPath = 
            normalizedPath.startsWith('/rest/api/2/') ||
            normalizedPath.startsWith('/rest/api/3/') ||
            normalizedPath.startsWith('/secure/attachment/');

          if (!isAllowedPath || normalizedPath.includes('..')) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'İzin verilmeyen API yolu.' }));
            return;
          }

          const destination = `${targetUrl}${normalizedPath}`;

          let body = [];
          req.on('data', chunk => body.push(chunk));
          req.on('end', async () => {
            try {
              const headers = {};
              if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
              if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
              if (req.headers['x-atlassian-token']) headers['X-Atlassian-Token'] = req.headers['x-atlassian-token'];
              headers['Accept'] = 'application/json';
              headers['Origin'] = targetUrl;
              headers['Referer'] = `${targetUrl}/`;

              const upstream = await fetch(destination, {
                method: req.method,
                headers,
                body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? Buffer.concat(body) : undefined,
              });

              res.statusCode = upstream.status;
              const ct = upstream.headers.get('content-type') || 'application/json';
              res.setHeader('Content-Type', ct);

              const responseBuffer = await upstream.arrayBuffer();
              res.end(Buffer.from(responseBuffer));
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const jiraBaseUrl = (env.VITE_JIRA_BASE_URL || '').replace(/\/+$/, '')
  const isRealBaseUrl = jiraBaseUrl && !jiraBaseUrl.includes('your-domain')

  return {
    plugins: [react(), devApiProxyPlugin(env)],
    server: {
      proxy: isRealBaseUrl ? {
        '/jira-api': {
          target: jiraBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/jira-api/, ''),
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Origin', jiraBaseUrl);
              proxyReq.setHeader('Referer', `${jiraBaseUrl}/`);
            });
          },
        },
      } : {},
    },
  }
})
