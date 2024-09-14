import { Tool } from "ollama";
import { AvailableToolName } from "./type";

export function getTimestampFromOs(): number {
  const date = new Date();
  return Math.floor(date.getTime() / 1000);
}

export const getTimestampFromOsTool: Tool = {
  type: "function",
  function: {
    name: AvailableToolName.getTimestampFromOs,
    description: "Get the timestamp seconds number from operating system",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};
