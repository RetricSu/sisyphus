import { AIInterface, AIChatProp, AIChatResponse, MessageRole } from './type';
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { AI } from './ai';

export class OpenAIAdapter extends AI implements AIInterface {
  client: OpenAIProvider;

  constructor(apiKey: string, apiUrl: string) {
    super();
    this.client = createOpenAI({ baseURL: apiUrl, apiKey });
  }

  async chat({ isSTream, msgs, model, tools }: AIChatProp): Promise<AIChatResponse> {
    const result = await generateText({
      model: this.client(model),
      messages: msgs as any,
      tools: this.fromTools(tools),
      maxSteps: 3,
    });

    const message = {
      role: MessageRole.assistant,
      content: result.text,
    };
    return {
      message,
    };
  }
}
