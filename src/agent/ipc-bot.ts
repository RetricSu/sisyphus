import fs from 'fs';
import net from 'net';
import path from 'path';
import { getDefaultIPCSocketPath } from '../config/setting';
import { logger } from '../logger';
import { DBMessage } from '../memory/db-message';
import { Agent } from './base';

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
        const amsg = new DBMessage(this.memoId, 'user', requestText);
        const newMsgs = await this.call({ requestMsg: amsg.msg });
        let answer = '';
        for (let i = 0; i < newMsgs.length; i++) {
          answer += JSON.stringify(newMsgs[i].content);
        }
        // todo: need a more sophisticated interface for two ipc
        socket.write(answer);
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
      const amsg = new DBMessage(this.memoId, 'user', requestText);
      const newMsgs = await this.call({ requestMsg: amsg.msg });
      let answer = '';
      for (let i = 0; i < this.messages.length; i++) {
        answer += JSON.stringify(newMsgs[i].content);
      }
      // todo: need a more sophisticated interface for two ipc
      client.write(answer); // send response
    });

    client.on('end', () => {
      logger.info('disconnect from IPC Sever.');
    });
  }
}
