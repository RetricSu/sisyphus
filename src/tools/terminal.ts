import { execSync } from 'child_process';
import z from 'zod';
import { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

export interface TerminalToolExecParameter {
  command: string;
}

export type TerminalToolBoxType = ToolBox<[TerminalToolExecParameter], string>;

export const terminalToolBox: TerminalToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'call_terminal_simulator',
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
  params: z.object({
    command: z.string().describe('The command to exec in the linux terminal'),
  }),
  exec: ({ command }: TerminalToolExecParameter) => {
    const result = execSync(command);
    return result.toString('utf-8');
  },
};

const tool: Tool = {
  names: ['call_terminal_simulator'],
  build: (_p: PromptFile) => {
    return [terminalToolBox];
  },
};

export default tool;
