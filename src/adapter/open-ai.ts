import { AI, AIChatProp, AIChatResponse, Message, MessageRole } from './type';
import { ToolCallRequest, ToolInterface } from '../tools/type';
import OpenAI from 'openai';
import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/index.mjs';
import { Stream } from 'openai/streaming.mjs';

export class OpenAIAdapter implements AI {
  client: OpenAI;
  role: MessageRole;

  constructor(apiKey: string, apiUrl: string, role: MessageRole = MessageRole.assistant) {
    this.client = new OpenAI({ baseURL: apiUrl, apiKey });
    this.role = role;
  }

  async chat({ isSTream, msgs, model, tools }: AIChatProp): Promise<AIChatResponse> {
    if (isSTream) {
      const _apiRes = (await this.client.chat.completions.create({
        model,
        messages: msgs as ChatCompletionMessageParam[],
        stream: isSTream,
        tools: this.fromTools(tools),
      })) as Stream<ChatCompletionChunk>;

      throw new Error('not impl!');
    }

    const apiRes = (await this.client.chat.completions.create({
      model,
      messages: msgs as ChatCompletionMessageParam[],
      stream: isSTream,
      tools: this.fromTools(tools),
    })) as ChatCompletion;

    const toolCalls: ToolCallRequest[] = [];
    if (apiRes.choices[0].message.tool_calls) {
      for (const toolCall of apiRes.choices[0].message.tool_calls) {
        toolCalls.push({
          name: toolCall.function.name,
          parameters: JSON.parse(toolCall.function.arguments),
        });
      }
    }

    const message: Message = { role: this.role, content: apiRes.choices[0].message.content, toolCalls };

    return {
      message,
    };
  }

  fromMessage(msg: Message): ChatCompletionMessageParam {
    return {
      role: msg.role as any,
      content: msg.content,
      tool_calls: msg.toolCalls.map((t) => {
        return {
          id: t.name,
          type: 'function',
          function: {
            name: t.name,
            arguments: JSON.stringify(t.parameters),
          },
        };
      }),
    };
  }

  toMessage(msg: ChatCompletionAssistantMessageParam): Message {
    return {
      role: msg.role as MessageRole,
      content: msg.content as string | null,
      toolCalls:
        msg.tool_calls?.map((t) => {
          return {
            name: t.function.name,
            parameters: JSON.parse(t.function.arguments),
          };
        }) || [],
    };
  }

  fromTools(tools: ToolInterface[]): ChatCompletionTool[] {
    return tools.map((tool) => {
      return {
        type: 'function',
        function: tool.function,
      };
    });
  }
}
