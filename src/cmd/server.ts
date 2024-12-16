import { buildHttpServer } from '../server/http';

export interface RunServerProp {
  port?: number;
  memoId: string;
  limit?: number;
}
export function runServer({ port, memoId, limit }: RunServerProp) {
  const { start } = buildHttpServer(memoId, limit, port);
  start();
}
