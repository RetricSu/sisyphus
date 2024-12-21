import path from "path";
import express from "express";
import { logger } from "../logger";
import { MessageView } from "../memory/message-view";
import { ALLOWED_EXTENSIONS, isPathSafe } from "./static";

export function buildHttpServer(
  memoId: string,
  limit = 20,
  port = 3000,
  staticPath?: string,
) {
  const app: express.Application = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "./views"));

  // Serve static files if path is provided
  if (staticPath) {
    const absolutePath = path.resolve(staticPath);

    if (!isPathSafe(absolutePath)) {
      throw new Error("Static path is invalid or inaccessible");
    }

    app.use(
      "/static",
      express.static(absolutePath, {
        // security options
        dotfiles: "deny", // forbidden to access dot files
        index: false, // disable directory index
        setHeaders: (res, filePath) => {
          // check file extension
          const ext = path.extname(filePath).toLowerCase();
          if (!ALLOWED_EXTENSIONS.has(ext)) {
            res.status(403).end();
            return;
          }

          // security headers
          res.set("X-Content-Type-Options", "nosniff");
          res.set("Cache-Control", "no-store, max-age=0");
        },
      }),
    );

    logger.debug(`Serving static files from: ${absolutePath}`);
  }

  app.get("/history", (_req, res) => {
    const messages = MessageView.listAllMessages(memoId, limit);
    res.render("chat", { messages });
  });

  app.get("/", (_req, res) => {
    res.redirect("/history");
  });

  return {
    start: () => {
      app.listen(port, () => {
        logger.debug(`Server is running at http://localhost:${port}`);
      });
    },
  };
}
