import { AMessage } from '../memory/a-message';
import { Agent } from './agent';
import { getDefaultIPCSocketPath } from '../config/setting';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

export class IPCBot extends Agent {
  socketPath: string;
  server: net.Server;

  pipeResponse?: ((name: string, word: string) => any) | undefined;

  constructor({
    socketPath,
    saveMemory,
    promptName,
  }: {
    socketPath?: string;
    saveMemory?: boolean;
    promptName: string;
  }) {
    const pipeResponse = async (_name: string, word: string) => {
      return await console.log('>>> ', _name, ': ', word);
    };
    super({
      saveMemory,
      promptName,
      pipeResponse,
    });

    const server = net.createServer((socket) => {
      socket.on('data', async (data) => {
        const requestText = data.toString();
        const msg = new AMessage(this.memoId, 'user', requestText);
        const resp = await this.call(msg.msg);
        socket.write(resp.msg.content);
      });

      socket.on('end', () => {
        logger.debug('disconnect from client-side');
      });
    });
    this.server = server;
    this.socketPath = socketPath || getDefaultIPCSocketPath(this.memoId);
  }

  listen() {
    // create socket path folder if not exits
    const parentFolder = path.dirname(this.socketPath);
    if (!fs.existsSync(parentFolder)) {
      fs.mkdirSync(parentFolder, { recursive: true });
    }

    // start listening
    this.server
      .listen(this.socketPath, () => {
        logger.info(`IPC Bot Server Listening at ${this.socketPath}`);
        logger.info(`Waiting for connection...`);
      })
      .on('error', (err) => {
        throw new Error(`can't start the server: ${err.message}`);
      });

    // take care of the socketPath file descriptor release when program shutdown
    // 1. deal with program exit
    process.on('exit', () => {
      this.server.close(() => {
        logger.debug(`Sever closed, release socketPath at ${this.socketPath}`);
        process.exit(0);
      });
    });
    // 2. deal with SIGINT eg Ctrl+C
    process.on('SIGINT', () => {
      this.server.close(() => {
        logger.debug(`Sever closed, released socketPath at ${this.socketPath}`);
        process.exit(0);
      });
    });
    // 3. deal with program panic
    process.on('uncaughtException', (error) => {
      this.server.close(() => {
        logger.debug(`uncaughtException ${error?.message}`);
        logger.debug(`Sever closed, released socketPath at ${this.socketPath}`);
        process.exit(0);
      });
    });
  }

  sendClientRequest(socketPath: string, initialMessage: string) {
    const client = net.createConnection(socketPath, () => {
      client.write(initialMessage); // send message
    });

    client.on('data', async (data) => {
      const requestText = data.toString();
      const msg = new AMessage(this.memoId, 'user', requestText);
      const resp = await this.call(msg.msg);
      client.write(resp.msg.content); // send response
    });

    client.on('end', () => {
      logger.info('disconnect from IPC Sever.');
    });
  }
}
