import z from 'zod';
import { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

export type TimeToolExecParameter = void;

export type TimeToolBoxType = ToolBox<[TimeToolExecParameter], string>;

export const timeToolBox: TimeToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'get_current_time_from_os',
      description: 'Get the readable time from operating system',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  params: z.object({}),
  exec: (_p: TimeToolExecParameter) => {
    const date = new Date();
    return date.toISOString();
  },
};

const tool: Tool = {
  names: ['get_current_time_from_os'],
  build: (_p: PromptFile) => {
    return [timeToolBox];
  },
};

export default tool;
