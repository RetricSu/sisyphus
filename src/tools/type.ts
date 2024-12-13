import { Tool as OllamaTool } from 'ollama';
import z, { Schema } from 'zod';

export interface ToolBox<T extends any[] = any[], R = any> {
  fi: ToolInterface;
  exec: (...args: T) => R;
  params: z.ZodTypeAny | Schema<any>;
}

export type ToolBoxSet = Record<string, ToolBox>;

export type ToolInterface = OllamaTool;
export interface ToolCallRequest {
  name: string;
  parameters: {
    [key: string]: string;
  };
}

export interface ToolCallResponse {
  status: 'failed' | 'success';
  name: string;
  terminalCommand?: string;
  result?: unknown;
  error?: string;
}
