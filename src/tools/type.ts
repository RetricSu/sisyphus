import type { Tool as OllamaTool } from 'ollama';
import type z from 'zod';
import type { Schema } from 'zod';
import { PromptFile } from '../prompt';

export interface Tool {
  names: string[];
  build: (params: PromptFile) => ToolBox[]; // todo: protect secret info on prompt file
}

export type Tools = Tool[];

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
