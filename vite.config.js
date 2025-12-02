import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = env.VITE_DEV_ID_TOKEN || '';

  return {
    plugins: [
      react(),
      {
        name: 'dev-api-test-endpoint',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use('/api-test', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            try {
              if (!token) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing VITE_DEV_ID_TOKEN' }));
                return;
              }
              // Collect body
              const chunks = [];
              for await (const chunk of req) chunks.push(chunk);
              const bodyStr = Buffer.concat(chunks).toString('utf-8') || '{}';

              const backendResp = await fetch('https://hitescape-agent-ws2qitn7ea-nw.a.run.app/search', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: bodyStr
              });

              const text = await backendResp.text();
              res.statusCode = backendResp.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(text);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err?.message || err) }));
            }
          });
        }
      }
    ],
    server: {
      host: true,
      port: 5173
    },
    preview: {
      host: true,
      port: 5173
    }
  };
});


