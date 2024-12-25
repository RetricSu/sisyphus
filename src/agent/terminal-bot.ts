import { AssistantContent, CoreMessage } from 'ai';
import chalk from 'chalk';
import ora from 'ora';
import process from 'process';
import Readline from 'readline/promises';
import { AMessage } from '../memory/a-message';
import { Agent } from './base';

export class TerminalBot extends Agent {
  pipeResponse?: ((name: string, word: string) => any) | undefined;
  constructor({
    saveMemory,
    promptName,
  }: {
    saveMemory?: boolean;
    promptName?: string;
  }) {
    super({
      saveMemory,
      promptName,
    });
  }

  displayAssistantMessage(msgs: CoreMessage[]) {
    for (const msg of msgs.filter((m) => m.role === 'assistant')) {
      let content = '';
      const assistantMsgContent = msg.content as AssistantContent;
      if (typeof assistantMsgContent === 'string' && assistantMsgContent !== '') {
        content = assistantMsgContent;
      } else {
        if (Array.isArray(assistantMsgContent)) {
          // don't display tool-calls
          content += assistantMsgContent.filter((c) => c.type === 'text').map((c) => c.text);
        } else {
          content = JSON.stringify(assistantMsgContent);
        }
      }
      if (content !== '') {
        console.log(`>>> ${this.name}: ${content}`);
      }
    }
  }

  private async reqMsgsFromAI(requestMsg?: { role: string; content: string }) {
    const loader = ora(chalk.blue(`${this.name} is thinking..`)).start();
    try {
      const msgs = await this.call({
        requestMsg,
      });
      loader.stop();
      this.displayAssistantMessage(msgs);
    } catch (error) {
      loader.fail(`${this.name}: Error ${error}`);
    }
  }

  async chat() {
    await this.loadPromptMessage();

    // call the model first to get the first message
    await this.reqMsgsFromAI({ role: 'user', content: 'start' });

    while (true) {
      const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const input = await readline.question(chalk.green('>>> You: '));
      readline.close();
      console.log('----');

      const amsg = new AMessage(this.memoId, 'user', input);
      await this.reqMsgsFromAI(amsg.msg);
    }
  }
}
