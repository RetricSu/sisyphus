import { AMessage } from '../memory/a-message';
import { Agent } from './agent';
import net from 'net';
import { getDefaultIPCSocketPath } from '../config/setting';
import fs from 'fs';
import path from 'path';

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
        console.log('客户端已断开连接');
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
        console.log(`服务器已启动，等待客户端连接: ${this.socketPath}`);
      })
      .on('error', (err) => {
        throw new Error(`无法启动服务器: ${err.message}`);
      });

    // 处理进程退出时关闭服务器
    process.on('exit', () => {
      this.server.close(() => {
        console.log(`服务器已关闭，释放 socketPath ${this.socketPath}`);
        process.exit(0); // 优雅退出
      });
    });
    // 处理 SIGINT 信号（如 Ctrl+C）
    process.on('SIGINT', () => {
      this.server.close(() => {
        console.log(`服务器已关闭，释放 socketPath ${this.socketPath}`);
        process.exit(0); // 优雅退出
      });
    });
    process.on('uncaughtException', (error) => {
      this.server.close(() => {
        console.log(`uncaughtException ${error?.message}, 服务器已关闭，释放 socketPath ${this.socketPath}`);
        process.exit(0); // 优雅退出
      });
    });
  }

  sendClientRequest(socketPath: string, initialMessage: string) {
    const client = net.createConnection(socketPath, () => {
      client.write(initialMessage); // 发送消息
    });

    client.on('data', async (data) => {
      const requestText = data.toString();
      const msg = new AMessage(this.memoId, 'user', requestText);
      const resp = await this.call(msg.msg);
      client.write(resp.msg.content); // 回复消息
    });

    client.on('end', () => {
      console.log('与服务器的连接已断开');
    });
  }
}
