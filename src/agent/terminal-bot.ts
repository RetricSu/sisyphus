import process from 'process';
import Readline from 'readline/promises';
import chalk from 'chalk';
import { AMessage } from '../memory/a-message';
import { Agent } from './base';
import { stdOutWriteSync } from './util';

export class TerminalBot extends Agent {
  pipeResponse?: ((name: string, word: string) => any) | undefined;
  constructor({ saveMemory, promptName }: { saveMemory?: boolean; promptName?: string }) {
    const pipeResponse = async (_name: string, word: string) => {
      return await console.log(word);
    };
    super({
      saveMemory,
      promptName,
      pipeResponse,
    });
  }

  async chat() {
    await this.loadPromptMessage();

    // call the model first to get the first message
    await stdOutWriteSync(`>>> ${this.name}: `);
    await this.call({requestMsg: {role: 'user', content: 'start'}});

    while (true) {
      // if the last message is not a toolCall Response, let user input
      const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      const input = await readline.question(chalk.green(\'>>> You: \'));
      const input = await readline.question('>>> You: ');
      readline.close();
      console.log('----');

      await stdOutWriteSync(`>>> ${this.name}: `);
      const amsg = new AMessage(this.memoId, 'user', input);
      await this.call({ requestMsg: amsg.msg });
    }
  }
}
