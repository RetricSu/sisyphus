import { CMessage } from "../memory/c-message";
import { readWebPage, readWebPageTool } from "./network";
import { callTerminalSimulator, callTerminalSimulatorTool } from "./terminal";
import { getTimestampFromOs, getTimestampFromOsTool } from "./time";
import { AvailableToolName, Tools } from "./type";
import { parseToolCall } from "./util";

export const tools: Tools = {
  get_timestamp_from_os: getTimestampFromOsTool,
  call_terminal_simulator: callTerminalSimulatorTool,
  read_webpage_content: readWebPageTool,
};

export const toolExecutor = {
  get_timestamp_from_os: getTimestampFromOs,
  call_terminal_simulator: callTerminalSimulator,
  read_webpage_content: readWebPage,
};

export async function buildToolCallResponseCMessage(content: string) {
  const toolCall = parseToolCall(content)!;
  let functionResponse;
  switch (toolCall.name) {
    case AvailableToolName.getTimestampFromOs:
      functionResponse = toolExecutor.get_timestamp_from_os();
      break;

    case AvailableToolName.callTerminalSimulator:
      functionResponse = toolExecutor.call_terminal_simulator(
        toolCall.parameters.command
      );
      break;

    case AvailableToolName.readWebpageContent:
      functionResponse = await toolExecutor.read_webpage_content(
        toolCall.parameters.url
      );
      break;

    default:
      break;
  }
  if (functionResponse == null) {
    const resp = {
      status: "failed",
      error: `there is no ${toolCall.name} such function`,
    };
    const toolCmsg = new CMessage("tool", JSON.stringify(resp));
    return toolCmsg;
  }

  // Add function response to the conversation
  const resp = {
    status: "success",
    toolCall: toolCall.name,
    terminalCommand: "null",
    result: `${functionResponse.toString()}`,
  };
  if (toolCall.name === AvailableToolName.callTerminalSimulator) {
    resp["terminalCommand"] = toolCall.parameters.command;
  }
  const toolCmsg = new CMessage("tool", JSON.stringify(resp));
  return toolCmsg;
}
