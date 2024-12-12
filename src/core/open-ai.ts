import { AIInterface, AIChatProp, AIChatResponse } from './type';
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { AI } from './ai';

export class OpenAIAdapter extends AI implements AIInterface {
  client: OpenAIProvider;

  constructor(apiKey: string, apiUrl: string) {
    super();
    this.client = createOpenAI({ baseURL: apiUrl, apiKey });
  }

  async chat({ isSTream, msgs, model, tools, maxSteps }: AIChatProp): Promise<AIChatResponse> {
    return await this.genTextFromLLM({ client: this.client, isSTream, msgs, model, tools, maxSteps });
  }
}
