import express from 'express';
import path from 'path';
import { MessageView } from '../memory/message-view';

export function buildHttpServer(memoId: string, port: number = 3000) {
  const app: express.Application = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, './views'));

  app.get('/history', (_req, res) => {
    const messages = MessageView.listAllMessages(memoId);
    res.render('chat', { messages });
  });

  app.get('/', (_req, res) => {
    res.redirect('/history');
  });

  return {
    start: () => {
      app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
      });
    },
  };
}
