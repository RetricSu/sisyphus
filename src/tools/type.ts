import { Tool } from "ollama";

export enum AvailableToolName {
  getTimestampFromOs = "get_timestamp_from_os",
  callTerminalSimulator = "call_terminal_simulator",
  readWebpageContent = "read_webpage_content",
}

export type Tools = Record<AvailableToolName, Tool>;
export interface ToolCallRequest {
  name: string;
  parameters: {
    [key: string]: string;
  };
}
