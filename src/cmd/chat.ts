import { TerminalBot } from '../agent/terminal-bot';
import { logger } from '../logger';

export interface ChatProp {
  promptName?: string;
  saveMemory?: boolean;
}

export async function chat({ promptName, saveMemory }: ChatProp) {
  const bot = new TerminalBot({ promptName, saveMemory });
  try {
    if (!(await bot.isChromaServerRunning())) {
      await bot.startChromaServer();
    }
    await bot.chat();
  } catch (error) {
    logger.error('some thing went wrong...');
    console.log(error);
    process.exit(1);
  }
}
