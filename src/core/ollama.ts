import { AIInterface, AIChatProp, AIChatResponse, MessageRole } from './type';
import { createOllama, OllamaProvider } from 'ollama-ai-provider';
import { generateText } from 'ai';
import { AI } from './ai';

export class OllamaAdapter extends AI implements AIInterface {
  client: OllamaProvider;

  constructor(apiUrl: string) {
    super();
    this.client = createOllama({ baseURL: apiUrl });
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
    result.response.messages;

    return {
      message,
    };
  }
}
