import { AI, AIChatProp, AIChatResponse, Message, MessageRole } from './type';
import { ToolCallRequest, ToolInterface } from '../tools/type';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam, Tool, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs';
import { randomBytes } from 'crypto';

export class AnthropicAdapter implements AI {
  client: Anthropic;
  role: MessageRole;

  constructor(apiKey: string, apiUrl: string, role: MessageRole = MessageRole.assistant) {
    this.client = new Anthropic({ baseURL: apiUrl, apiKey });
    this.role = role;
  }

  async chat({ isSTream, msgs, model, tools }: AIChatProp): Promise<AIChatResponse> {
    if (isSTream) {
      throw new Error('not impl!');
    }

    const apiRes = await this.client.messages.create({
      model,
      messages: msgs.map((msg) => this.fromMessage(msg)),
      stream: isSTream,
      tools: this.fromTools(tools),
      max_tokens: 1024,
    });

    const toolCalls: ToolCallRequest[] = [];
    let answer: string = '';
    for (const content of apiRes.content) {
      if (content.type === 'text') {
        answer += content.text;
      }

      if (content.type === 'tool_use') {
        toolCalls.push({
          name: content.name,
          parameters: content.input as any,
        });
      }
    }

    const message: Message = { role: this.role, content: answer, toolCalls };

    return {
      message,
    };
  }

  fromMessage(msg: Message): MessageParam {
    if (msg.toolCalls.length > 0) {
      return {
        role: msg.role as any,
        content: msg.toolCalls.map((t) => {
          const toolUseBlockParam: ToolUseBlockParam = {
            id: randomBytes(4).toString('hex'),
            input: t.parameters,
            name: t.name,
            type: 'tool_use',
          };
          return toolUseBlockParam;
        }),
      };
    }

    return {
      role: msg.role as any,
      content: msg.content || '',
    };
  }

  toMessage(msg: MessageParam): Message {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role as MessageRole,
        content: msg.content,
        toolCalls: [],
      };
    }

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

  fromTools(tools: ToolInterface[]): Tool[] {
    return tools.map((tool) => {
      return {
        name: tool.function.name,
        description: tool.function.description,
        input_schema: {
          type: 'object',
          properties: tool.function.parameters.properties,
          reuqired: tool.function.parameters.required,
        },
      };
    });
  }
}
