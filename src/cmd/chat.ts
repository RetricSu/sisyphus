import { Brain } from '../llm/brain';

export interface ChatProp {
  promptNames?: string[];
  saveMemory?: boolean;
}

export async function chat({ promptNames, saveMemory }: ChatProp) {
  const brain = new Brain({ promptNames, saveMemory });
  try {
    if (!brain.isLLMServerRunning()) {
      await brain.startLLMServer();
    }
    await brain.chat([]);
  } catch (error) {
    console.error('failed to start the ollama server, ', error);
    process.exit(1);
  }
}
