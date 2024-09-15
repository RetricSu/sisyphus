import { execSync } from 'child_process';
import { Tool } from 'ollama';
import { AvailableToolName } from './type';

export function callTerminalSimulator(command: string) {
  try {
    const result = execSync(command);
    return result.toString('utf-8');
  } catch (error: unknown) {
    return `${JSON.stringify((error as Error).message)}`;
  }
}

export const callTerminalSimulatorTool: Tool = {
  type: 'function',
  function: {
    name: AvailableToolName.callTerminalSimulator,
    description: 'Get the result of executing a command in the linux terminal of the living server',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to exec in the linux terminal',
        },
      },
      required: ['command'],
    },
  },
};
