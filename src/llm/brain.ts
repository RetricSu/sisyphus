import process from 'process';
import Readline from 'readline/promises';
import { stdOutWriteSync } from './util';
import { Agent } from './agent';
import { AMessage } from '../memory/a-message';
import { buildNosCKBToolBox } from '../tools/nosCKB';
import { readWebPageToolBox } from '../tools/readWebPage';
import { terminalToolBox } from '../tools/terminal';
import { timeToolBox } from '../tools/time';
import { Privkey } from '../privkey';

export class Brain extends Agent {
  pipeResponse?: ((name: string, word: string) => any) | undefined;
  constructor({
    llmApiUrl,
    model,
    saveMemory,
    promptNames,
  }: {
    llmApiUrl?: string;
    model?: string;
    saveMemory?: boolean;
    promptNames?: string[];
  }) {
    const name = 'brain';
    const memoId = 'chat';
    const pipeResponse = async (_name: string, word: string) => {
      return await console.log(word);
    };
    const {
      ckbBalanceToolBox,
      accountInfoToolBox,
      transferCKBToolBox,
      publishNoteToolBox,
      readNostrEvents,
      readMentionNotesWithMe,
      publishProfileEvent,
      publishReplyNotesToEvent,
    } = buildNosCKBToolBox(Privkey.load());

    const toolBoxes = [
      timeToolBox,
      terminalToolBox,
      readWebPageToolBox,
      ckbBalanceToolBox,
      accountInfoToolBox,
      transferCKBToolBox,
      publishNoteToolBox,
      readNostrEvents,
      readMentionNotesWithMe,
      publishProfileEvent,
      publishReplyNotesToEvent,
    ];
    super({
      name,
      memoId,
      llmApiUrl,
      model,
      saveMemory,
      promptNames,
      pipeResponse,
      toolBoxes,
    });
  }

  async chat() {
    await this.LoadInitialMessages();

    while (true) {
      // if the last message is not a toolCall Response, let user input
      const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const input = await readline.question('>>> You: ');
      readline.close();
      console.log('----');

      await stdOutWriteSync(`>>> ${this.name}: `);
      const msg = new AMessage(this.memoId, 'user', input);
      await this.call(msg.msg);
    }
  }
}
