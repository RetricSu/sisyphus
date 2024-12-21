import { type OllamaProvider, createOllama } from 'ollama-ai-provider';
import { AI } from './ai';
import type { AIChatProp, AIChatResponse, AIInterface } from './type';

export class OllamaAdapter extends AI implements AIInterface {
  client: OllamaProvider;

  constructor(apiUrl: string) {
    super();
    this.client = createOllama({ baseURL: apiUrl });
  }

  async chat({ isSTream, msgs, model, tools, maxSteps }: AIChatProp): Promise<AIChatResponse> {
    return await this.genTextFromLLM({
      client: this.client,
      isSTream,
      msgs,
      model,
      tools,
      maxSteps,
    });
  }
}
