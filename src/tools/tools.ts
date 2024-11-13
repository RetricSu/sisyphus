import { AvailableToolName, ToolBox, ToolCallResponse } from './type';
import { parseToolCall } from './util';
import { Message, ToolCall } from 'ollama';

export class Tools {
  toolBox: ToolBox[];
  constructor(toolBox: ToolBox[]) {
    this.toolBox = toolBox;
  }

  async buildToolCallResponseCMessage(content: string): Promise<Message> {
    const toolCall = parseToolCall(content)!;

    const toolName = toolCall.name;
    const selectedTool = this.toolBox.find((tool) => tool.fi.function.name === toolName);
    if (!selectedTool) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: toolName as AvailableToolName,
        error: `there is no ${toolName} such available tool`,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }

    try {
      const executor = selectedTool.exec;
      const functionResponse = await executor(toolCall.parameters);
      const resp: ToolCallResponse = {
        status: 'success',
        name: toolName as AvailableToolName,
        result: functionResponse,
      };
      if (toolCall.name === AvailableToolName.callTerminalSimulator) {
        resp['terminalCommand'] = toolCall.parameters.command;
      }
      return { role: 'tool', content: JSON.stringify(resp) };
    } catch (error) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: toolName as AvailableToolName,
        error: (error as unknown as Error).message,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }
  }

  async executeToolCall(tool: ToolCall) {
    const name = tool.function.name;
    const parameters = tool.function.arguments;
    const selectedToolBox = this.toolBox.find((t) => t.fi.function.name === name);
    if (!selectedToolBox) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: name as AvailableToolName,
        error: `there is no ${name} such available tool`,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }

    try {
      const executor = selectedToolBox.exec;
      const functionResponse = await executor(parameters);
      const resp: ToolCallResponse = {
        status: 'success',
        name: name as AvailableToolName,
        result: functionResponse,
      };

      return {
        role: 'tool',
        content: JSON.stringify(resp),
      };
    } catch (error) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: name as AvailableToolName,
        error: (error as unknown as Error).message,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }
  }
}
