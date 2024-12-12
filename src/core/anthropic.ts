import { AIInterface, AIChatProp, AIChatResponse } from './type';
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { AI } from './ai';

export class AnthropicAdapter extends AI implements AIInterface {
  client: AnthropicProvider;

  constructor(apiKey: string, apiUrl: string) {
    super();
    this.client = createAnthropic({ baseURL: apiUrl, apiKey });
  }

  async chat({ isSTream, msgs, model, tools, maxSteps }: AIChatProp): Promise<AIChatResponse> {
    return await this.genTextFromLLM({ client: this.client, isSTream, msgs, model, tools, maxSteps });
  }
}
