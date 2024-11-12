import { Brain } from '../llm/brain';

export interface ChatProp {
  promptName?: string;
  saveMemory?: boolean;
}

export async function chat({ promptName, saveMemory }: ChatProp) {
  const brain = new Brain({ promptName, saveMemory });
  try {
    if (!(await brain.isChromaServerRunning())) {
      await brain.startChromaServer();
    }
    if (!(await brain.isLLMServerRunning())) {
      await brain.startLLMServer();
    }
    await brain.chat();
  } catch (error) {
    console.error('some thing went wrong, ', error);
    process.exit(1);
  }
}
