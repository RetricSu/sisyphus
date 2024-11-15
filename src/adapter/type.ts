import { ToolCallRequest, ToolInterface } from '../tools/type';

export interface AI {
  chat: (props: AIChatProp) => Promise<AIChatResponse>;
}

export enum MessageRole {
  user = 'user',
  assistant = 'assistant',
  tool = 'tool',
}

export interface Message {
  role: MessageRole;
  content: string | null;
  toolCalls: ToolCallRequest[];
}

export interface AIChatProp {
  msgs: Message[];
  model: string;
  tools: ToolInterface[];
  isSTream: boolean;
}

export interface AIChatResponse {
  message: Message;
}
