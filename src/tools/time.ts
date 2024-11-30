import z from 'zod';
import { AvailableToolName, ToolBox } from './type';

export interface TimeToolExecParameter {}

export type TimeToolBoxType = ToolBox<[TimeToolExecParameter], string>;

export const timeToolBox: TimeToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: AvailableToolName.getCurrentTimeFromOs,
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
