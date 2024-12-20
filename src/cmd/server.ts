import { buildHttpServer } from '../server/http';

export interface RunServerProp {
  port?: number;
  memoId: string;
  limit?: number;
  staticPath?: string;
}

export function runServer({ port, memoId, limit, staticPath }: RunServerProp) {
  const { start } = buildHttpServer(memoId, limit, port, staticPath);
  start();
}
