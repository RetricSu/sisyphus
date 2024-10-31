import { AvailableToolName, ToolBox } from './type';

export type TimeToolBoxType = ToolBox<[], number>;

export const timeToolBox: TimeToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: AvailableToolName.getTimestampFromOs,
      description: 'Get the timestamp milliseconds from operating system',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  exec: () => {
    const date = new Date();
    return Math.floor(date.getTime());
  },
};
