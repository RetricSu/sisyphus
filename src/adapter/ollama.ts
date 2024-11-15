import { Message as OllamaMessage, Ollama } from 'ollama';
import { AI, AIChatProp, AIChatResponse, Message, MessageRole } from './type';
import { checkIfToolCall, parseToolCall } from '../tools/util';
import { ToolCallRequest } from '../tools/type';

export class OllamaAdapter implements AI {
  ollama: Ollama;
  role: MessageRole;

  constructor(apiUrl: string, role: MessageRole = MessageRole.assistant) {
    this.ollama = new Ollama({ host: apiUrl });
    this.role = role;
  }

  async chat({ isSTream, msgs, model, tools }: AIChatProp): Promise<AIChatResponse> {
    if (isSTream) {
      let answer = '';
      const apiRes = await this.ollama.chat({
        model: model,
        messages: msgs.map((m) => this.fromMessage(m)),
        stream: isSTream as any,
        tools: tools,
      });

      for await (const part of apiRes) {
        const words = part.message.content;
        answer += words;
      }

      if (checkIfToolCall(answer)) {
        const toolCall = parseToolCall(answer)!;
        const response: AIChatResponse = {
          message: {
            role: this.role,
            content: null,
            toolCalls: [toolCall],
          },
        };
        return response;
      }

      const toolCalls: ToolCallRequest[] = [];
      const message: Message = { role: this.role, content: answer, toolCalls };
      const response: AIChatResponse = {
        message,
      };
      return response;
    }

    const apiRes = await this.ollama.chat({
      model: model,
      messages: msgs.map((m) => this.fromMessage(m)),
      tools: tools,
    });
    const toolCalls: ToolCallRequest[] = [];
    if (apiRes.message.tool_calls) {
      for (const toolCall of apiRes.message.tool_calls) {
        toolCalls.push({
          name: toolCall.function.name,
          parameters: toolCall.function.arguments,
        });
      }
    }
    const message: Message = { role: this.role, content: apiRes.message.content, toolCalls };

    return {
      message,
    };
  }

  fromMessage(msg: Message): OllamaMessage {
    return {
      role: msg.role,
      content: msg.content || '',
      tool_calls: msg.toolCalls.map((t) => {
        return {
          function: {
            name: t.name,
            arguments: t.parameters,
          },
        };
      }),
    };
  }

  toMessage(msg: OllamaMessage): Message {
    return {
      role: msg.role as MessageRole,
      content: msg.content,
      toolCalls:
        msg.tool_calls?.map((t) => {
          return {
            name: t.function.name,
            parameters: t.function.arguments,
          };
        }) || [],
    };
  }
}
