import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function devApiRoutesPlugin(): Plugin {
  return {
    name: 'dev-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const parsedUrl = new URL(req.url, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // Enhance req/res for Vercel / Express handler compatibility
        (req as any).query = Object.fromEntries(parsedUrl.searchParams);
        if (!(res as any).status) {
          (res as any).status = function (statusCode: number) {
            res.statusCode = statusCode;
            return res;
          };
        }
        if (!(res as any).json) {
          (res as any).json = function (data: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
        }

        try {
          if (pathname === '/api/download-ebook') {
            const { default: handler } = await server.ssrLoadModule('/api/download-ebook.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/stream-pdf' || pathname === '/api/reader/stream-pdf') {
            const { default: handler } = await server.ssrLoadModule('/api/stream-pdf.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/verify-payment') {
            if (req.method === 'POST' && !(req as any).body) {
              const buffers: Buffer[] = [];
              for await (const chunk of req) {
                buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              const raw = Buffer.concat(buffers).toString('utf-8');
              try {
                (req as any).body = JSON.parse(raw);
              } catch {
                (req as any).body = {};
              }
            }
            const { default: handler } = await server.ssrLoadModule('/api/verify-payment.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/razorpay-webhook') {
            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const raw = Buffer.concat(buffers).toString('utf-8');
            (req as any).rawBody = raw;
            try {
              (req as any).body = JSON.parse(raw);
            } catch {
              (req as any).body = {};
            }
            const { default: handler } = await server.ssrLoadModule('/api/razorpay-webhook.ts');
            return await handler(req, res);
          }
          if (pathname === '/api/test-notifications') {
            const { default: handler } = await server.ssrLoadModule('/api/test-notifications.ts');
            return await handler(req, res);
          }
        } catch (err: any) {
          console.error('[DevApiPlugin] Error handling route', pathname, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiRoutesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
