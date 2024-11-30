import { MessageRole, ToolCallResponse } from './type';
import { CoreTool, tool } from 'ai';
import { ToolBox } from '../tools/type';
import { logger } from '../logger';

export class AI {
  role: MessageRole;

  constructor(role: MessageRole = MessageRole.assistant) {
    this.role = role;
  }

  fromTools(tools: ToolBox[]) {
    const aiTools: Record<string, CoreTool> = {};
    for (const value of Object.values(tools)) {
      aiTools[value.fi.function.name] = tool({
        description: value.fi.function.description,
        parameters: value.params,
        execute: async (p: Parameters<typeof value.exec>) => {
          try {
            const executor = value.exec;
            const functionResponse = await executor(p);
            const resp: ToolCallResponse = {
              status: 'success',
              result: functionResponse,
            };
            this.debugToolCall(value.fi.function.name, resp);
            return resp;
          } catch (error) {
            const resp: ToolCallResponse = {
              status: 'failed',
              error: (error as unknown as Error).message,
            };
            this.debugToolCall(value.fi.function.name, resp);
            return resp;
          }
        },
      });
    }

    return aiTools;
  }

  debugToolCall(name: string, resp: ToolCallResponse) {
    logger.debug(
      `tool-call[${name}] => ${resp.status}, ${resp.error ? JSON.stringify(resp.error) : JSON.stringify(resp.result)}`,
    );
  }
}
