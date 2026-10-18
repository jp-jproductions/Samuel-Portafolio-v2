import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function vercelApiDevPlugin(): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || '';
        const pathname = urlStr.split('?')[0];

        if (pathname === '/api/projects' || pathname === '/api/upload') {
          try {
            const modulePath = `.${pathname}.ts`;
            const mod = await server.ssrLoadModule(modulePath);
            const handler = mod.default;

            const fullUrl = `http://${req.headers.host || 'localhost:3000'}${urlStr}`;
            let bodyBuffer: Buffer | undefined;

            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              bodyBuffer = Buffer.concat(chunks);
            }

            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value !== undefined) {
                headers.set(key, Array.isArray(value) ? value.join(', ') : value);
              }
            }

            const webReq = new Request(fullUrl, {
              method: req.method,
              headers,
              body: bodyBuffer && bodyBuffer.length > 0 ? new Uint8Array(bodyBuffer) : undefined,
              // @ts-ignore
              duplex: 'half',
            });

            const webRes: Response = await handler(webReq);

            res.statusCode = webRes.status;
            webRes.headers.forEach((val, key) => {
              res.setHeader(key, val);
            });

            const arrayBuf = await webRes.arrayBuffer();
            res.end(Buffer.from(arrayBuf));
            return;
          } catch (err: any) {
            console.error('Error executing dev API endpoint:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Error en servidor local' }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vercelApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
