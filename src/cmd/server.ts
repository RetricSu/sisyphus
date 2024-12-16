import { buildHttpServer } from '../server/http';

export interface RunServerProp {
  port?: number;
  memoId: string;
}
export function runServer({ port, memoId }: RunServerProp) {
  const { start } = buildHttpServer(memoId, port);
  start();
}
