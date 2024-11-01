import { execSync } from 'child_process';
import { AvailableToolName, ToolBox } from './type';

export type TerminalToolBoxType = ToolBox<[string], string>;

export const terminalToolBox: TerminalToolBoxType = {
  fi: {
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
  },
  exec: (command: string) => {
    const result = execSync(command);
    return result.toString('utf-8');
  },
};
