import { type GoogleGenerativeAIProvider, createGoogleGenerativeAI } from '@ai-sdk/google';
import { AI } from './ai';
import type { AIChatProp, AIChatResponse, AIInterface } from './type';

export class GoogleAdapter extends AI implements AIInterface {
  client: GoogleGenerativeAIProvider;

  constructor(apiKey: string, apiUrl: string) {
    super();
    this.client = createGoogleGenerativeAI({ baseURL: apiUrl, apiKey });
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
