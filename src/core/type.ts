import { ToolBox } from '../tools/type';

export interface AIInterface {
  chat: (props: AIChatProp) => Promise<AIChatResponse>;
}

export enum MessageRole {
  system = 'system',
  user = 'user',
  assistant = 'assistant',
  tool = 'tool',
}

export interface Message {
  role: MessageRole;
  content: string;
}

export interface AIChatProp {
  msgs: Message[];
  model: string;
  tools: ToolBox[];
  isSTream: boolean;
}

export interface AIChatResponse {
  message: Message;
}

export interface ToolCallResponse {
  status: 'success' | 'failed';
  error?: string;
  result?: unknown;
}
