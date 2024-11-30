import { ToolBox } from '../tools/type';
import { CoreMessage } from 'ai';

export interface AIInterface {
  chat: (props: AIChatProp) => Promise<AIChatResponse>;
}

export type Message = CoreMessage;

export interface AIChatProp {
  msgs: Message[];
  model: string;
  tools: ToolBox[];
  isSTream: boolean;
}

export interface AIChatResponse {
  msgs: Message[];
}

export interface ToolCallResponse {
  status: 'success' | 'failed';
  error?: string;
  result?: unknown;
}
