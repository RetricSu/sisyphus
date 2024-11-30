import { AIInterface, AIChatProp, AIChatResponse } from './type';
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { AI } from './ai';

export class AnthropicAdapter extends AI implements AIInterface {
  client: AnthropicProvider;

  constructor(apiKey: string, apiUrl: string) {
    super();
    this.client = createAnthropic({ baseURL: apiUrl, apiKey });
  }

  async chat({ isSTream: _isSTream, msgs, model, tools }: AIChatProp): Promise<AIChatResponse> {
    const result = await generateText({
      model: this.client(model),
      messages: msgs as any,
      tools: this.fromTools(tools),
      maxSteps: 3,
    });

    return {
      msgs: result.response.messages,
    };
  }
}
