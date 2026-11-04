import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import razorpayWebhookHandler from './api/razorpay-webhook.ts';
import verifyPaymentHandler from './api/verify-payment.ts';
import testNotificationsHandler from './api/test-notifications.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0';
  const isProduction = process.env.NODE_ENV === 'production';

  // Parse raw body for webhook HMAC signature verification, while preserving parsed json
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // API Route Handlers
  app.all('/api/razorpay-webhook', async (req, res) => {
    try {
      await razorpayWebhookHandler(req, res);
    } catch (err: any) {
      console.error('[Server] Webhook route error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  app.all('/api/verify-payment', async (req, res) => {
    try {
      await verifyPaymentHandler(req, res);
    } catch (err: any) {
      console.error('[Server] Verify payment route error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  app.all('/api/test-notifications', async (req, res) => {
    try {
      await testNotificationsHandler(req, res);
    } catch (err: any) {
      console.error('[Server] Test notifications route error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(port, host, () => {
    console.log(`[Server] Prompt Engineering Handbook running on http://${host}:${port} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});
