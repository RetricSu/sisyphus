import { TerminalBot } from '../llm/terminal-bot';
import { logger } from '../logger';

export interface ChatProp {
  promptName?: string;
  saveMemory?: boolean;
}

export async function chat({ promptName, saveMemory }: ChatProp) {
  const brain = new TerminalBot({ promptName, saveMemory });
  try {
    if (!(await brain.isChromaServerRunning())) {
      await brain.startChromaServer();
    }
    if (!(await brain.isLLMServerRunning())) {
      await brain.startLLMServer();
    }
    await brain.chat();
  } catch (error) {
    logger.error('some thing went wrong...');
    console.log(error);
    process.exit(1);
  }
}
