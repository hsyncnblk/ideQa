import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const jiraBaseUrl = env.VITE_JIRA_BASE_URL || 'https://jira.idefix.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/jira-api': {
          target: jiraBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/jira-api/, ''),
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Jira Cloud XSRF kontrollerini atlatmak için Origin ve Referer'i ez
              proxyReq.setHeader('Origin', jiraBaseUrl);
              proxyReq.setHeader('Referer', `${jiraBaseUrl}/`);
            });
          },
        },
      },
    },
  }
})
