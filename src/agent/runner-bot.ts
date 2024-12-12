import { Agent } from './base';

export class RunnerBot extends Agent {
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

  async start() {
    await this.loadPromptMessage();
    await this.callMessageWithStrategy();
  }
}
