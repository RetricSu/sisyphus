import path from 'path';
import express from 'express';
import { logger } from '../logger';
import { MessageView } from '../memory/message-view';
import { ALLOWED_EXTENSIONS, isPathSafe } from './static';

export function buildHttpServer(memoId: string, limit: number = 50, port: number = 3000, staticPath?: string) {
  const app: express.Application = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, './views'));

  // Serve static files if path is provided
  if (staticPath) {
    const absolutePath = path.resolve(staticPath);

    if (!isPathSafe(absolutePath)) {
      throw new Error('Static path is invalid or inaccessible');
    }

    app.use(
      '/static',
      (req, res, next) => {
        const ext = path.extname(req.path).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          res.status(403).send('Forbidden');
          return;
        }
        next();
      },
      express.static(absolutePath, {
        dotfiles: 'deny',
        index: false,
        setHeaders: (res) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'no-store, max-age=0');
        },
      }),
    );
  }

  app.get('/history', (_req, res) => {
    const messages = MessageView.listAllMessages(memoId, limit);
    res.render('chat', { messages });
  });

  app.get('/', (_req, res) => {
    res.redirect('/history');
  });

  return {
    start: () => {
      app.listen(port, () => {
        logger.debug(`Server is running at http://localhost:${port}`);
      });
    },
  };
}
