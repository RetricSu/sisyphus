import { IPCBot } from "../agent/ipc-bot";

export interface buildIPCBotProp {
  promptName: string;
  saveMemory?: boolean;
  socketPath?: string;
}

export async function buildIPCBot({
  promptName,
  saveMemory,
  socketPath,
}: buildIPCBotProp) {
  const bot = new IPCBot({ socketPath, promptName, saveMemory });

  try {
    if (!(await bot.isChromaServerRunning())) {
      await bot.startChromaServer();
    }

    return bot;
  } catch (error: unknown) {
    throw error as Error;
  }
}
