import { AIChatProp, AIChatResponse, ToolCallResponse } from './type';
import { CoreTool, generateText, tool } from 'ai';
import { ToolBox } from '../tools/type';
import { logger } from '../logger';
import { OpenAIProvider } from '@ai-sdk/openai';
import { AnthropicProvider } from '@ai-sdk/anthropic';
import { OllamaProvider } from 'ollama-ai-provider';

export class AI {
  role: string;

  constructor(role = 'assistant') {
    this.role = role;
  }

  async genTextFromLLM({
    client,
    isSTream: _isSTream,
    msgs,
    model,
    tools,
    maxSteps,
  }: AIChatProp & { client: OpenAIProvider | AnthropicProvider | OllamaProvider }): Promise<AIChatResponse> {
    const result = await generateText({
      model: client(model),
      messages: msgs as any,
      tools: this.fromTools(tools),
      maxSteps,
    });

    return {
      msgs: result.response.messages,
    };
  }

  fromTools(tools: ToolBox[]) {
    const aiTools: Record<string, CoreTool> = {};
    for (const value of Object.values(tools)) {
      aiTools[value.fi.function.name] = tool({
        description: value.fi.function.description,
        parameters: value.params,
        execute: async (p: Parameters<typeof value.exec>) => {
          try {
            const executor = value.exec;
            const functionResponse = await executor(p);
            const resp: ToolCallResponse = {
              status: 'success',
              result: functionResponse,
            };
            this.debugToolCall(value.fi.function.name, resp);
            return resp;
          } catch (error) {
            const resp: ToolCallResponse = {
              status: 'failed',
              error: (error as unknown as Error).message || JSON.stringify(error),
            };
            this.debugToolCall(value.fi.function.name, resp);
            return resp;
          }
        },
      });
    }

    return aiTools;
  }

  debugToolCall(name: string, resp: ToolCallResponse) {
    logger.debug(
      `[${name}] => ${resp.status}, ${resp.error ? JSON.stringify(resp.error) : JSON.stringify(resp.result)}\n`,
    );
  }
}
