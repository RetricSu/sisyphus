import type { CoreMessage } from "ai";
import type { ToolBox } from "../tools/type";

export interface AIInterface {
  chat: (props: AIChatProp) => Promise<AIChatResponse>;
}

export type Message = CoreMessage;

export interface AIChatProp {
  msgs: Message[];
  model: string;
  tools: ToolBox[];
  isSTream: boolean;
  maxSteps: number;
}

export interface AIChatResponse {
  msgs: Message[];
}

export interface ToolCallResponse {
  status: "success" | "failed";
  error?: string;
  result?: unknown;
}
