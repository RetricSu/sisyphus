import fs from 'fs';
import z from 'zod';
import { PromptFile } from '../prompt';
import { sanitizeFullFilePath } from '../util/fs';
import type { Tool, ToolBox } from './type';

export interface ReadFileLineResult {
  lineNumber: number;
  text: string;
}

export type FileEditToolExecParameter = {
  filePath: string;
  lineNumber: number;
  text: string;
};

export type FileDeleteLineToolExecParameter = {
  filePath: string;
  lineNumber: number;
};

export type FileInsertLineToolExecParameter = {
  filePath: string;
  lineNumber: number;
  text: string;
};

export type FileReadAllToolExecParameter = {
  filePath: string;
};

export type FileReadPartToolExecParameter = {
  filePath: string;
  startLine: number;
  endLine: number;
};

export type FileReadLastServalLinesToolExecParameter = {
  filePath: string;
  lines: number;
};

export type FileInsertMultipleLinesToolExecParameter = {
  filePath: string;
  lineNumber: number;
  lines: string; // string with new line characters "\n"
};

export type FileSearchToolExecParameter = {
  filePath: string;
  query: string;
};

export type FileEditToolBoxType = ToolBox<[FileEditToolExecParameter], string>;

export type FileDeleteLineToolBoxType = ToolBox<[FileDeleteLineToolExecParameter], string>;

export type FileInsertMultipleLinesToolBoxType = ToolBox<[FileInsertMultipleLinesToolExecParameter], string>;
export type FileInsertLineToolBoxType = ToolBox<[FileInsertLineToolExecParameter], string>;

export type FileReadAllToolBoxType = ToolBox<[FileReadAllToolExecParameter], ReadFileLineResult[]>;

export type FileReadPartToolBoxType = ToolBox<[FileReadPartToolExecParameter], ReadFileLineResult[]>;

export type FileSearchToolBoxType = ToolBox<[FileSearchToolExecParameter], ReadFileLineResult[]>;

export type FileReadLastServalLinesToolBoxType = ToolBox<
  [FileReadLastServalLinesToolExecParameter],
  ReadFileLineResult[]
>;

export const fileEditToolBox: FileEditToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'edit_file_with_line_number',
      description: 'edit text in the file with a specific single line number',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to edit',
          },
          lineNumber: {
            type: 'number',
            description: 'the line number to edit',
          },
          text: {
            type: 'string',
            description: 'the text to replace the line',
          },
        },
        required: ['filePath', 'lineNumber', 'text'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to edit'),
    lineNumber: z.number().describe('the line number to edit'),
    text: z.string().describe('the text to replace the line'),
  }),
  exec: (p: FileEditToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    // Adjust for 1-based line numbers
    data[p.lineNumber - 1] = p.text;
    fs.writeFileSync(filePath, data.join('\n'));
    return 'File edited successfully';
  },
};

export const fileDeleteLineToolBox: FileDeleteLineToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'delete_line_from_file',
      description: 'delete a line from the file with a specific line number',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to delete a line',
          },
          lineNumber: {
            type: 'number',
            description: 'the line number to delete',
          },
        },
        required: ['filePath', 'lineNumber'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to delete a line'),
    lineNumber: z.number().describe('the line number to delete'),
  }),
  exec: (p: FileDeleteLineToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    // Adjust for 1-based line numbers
    data.splice(p.lineNumber - 1, 1);
    fs.writeFileSync(filePath, data.join('\n'));
    return 'Line deleted successfully';
  },
};

export const fileInsertLineToolBox: FileInsertLineToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'insert_line_to_file',
      description: 'insert a line to the file with a specific line number, the original line will be pushed down',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to insert a line',
          },
          lineNumber: {
            type: 'number',
            description: 'the line number to insert',
          },
          text: {
            type: 'string',
            description: 'the text to insert',
          },
        },
        required: ['filePath', 'lineNumber', 'text'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to insert a line'),
    lineNumber: z.number().describe('the line number to insert'),
    text: z.string().describe('the text to insert'),
  }),
  exec: (p: FileInsertLineToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');

    // Validate and safely insert the new line
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    // Adjust for 1-based line numbers
    const targetLine = Math.max(0, Math.min(p.lineNumber - 1, data.length));

    // Ensure text is a string
    const textToInsert = p.text ?? '';

    // Insert the new line, pushing existing content down
    data.splice(targetLine, 0, textToInsert);

    fs.writeFileSync(filePath, data.join('\n'));
    return 'Line inserted successfully';
  },
};

export const fileReadAllToolBox: FileReadAllToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_full_file_with_line_numbers',
      description: 'read the full content of a file, return the file content with line numbers',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to read',
          },
        },
        required: ['filePath'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to read'),
  }),
  exec: (p: FileReadAllToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    return data.map((line, index) => ({
      lineNumber: index + 1,
      text: line,
    }));
  },
};

export const fileReadPartToolBox: FileReadPartToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_part_of_file_with_line_numbers',
      description: 'read part of the content of a file, return the file content with line numbers',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to read',
          },
          startLine: {
            type: 'number',
            description: 'the start line number to read',
          },
          endLine: {
            type: 'number',
            description: 'the end line number to read',
          },
        },
        required: ['filePath', 'startLine', 'endLine'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to read'),
    startLine: z.number().describe('the start line number to read'),
    endLine: z.number().describe('the end line number to read'),
  }),
  exec: (p: FileReadPartToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    return data.slice(p.startLine - 1, p.endLine).map((line, index) => ({
      lineNumber: p.startLine + index,
      text: line,
    }));
  },
};

export const fileReadLastServalLinesToolBox: FileReadLastServalLinesToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_last_several_lines_of_file_with_line_numbers',
      description: 'read the last several lines of a file, return the file content with line numbers',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to read',
          },
          lines: {
            type: 'number',
            description: 'the number of lines to read from the end of the file',
          },
        },
        required: ['filePath', 'lines'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to read'),
    lines: z.number().describe('the number of lines to read from the end of the file'),
  }),
  exec: (p: FileReadLastServalLinesToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    return data.slice(-p.lines).map((line, index) => ({
      lineNumber: data.length - p.lines + index + 1,
      text: line,
    }));
  },
};

export const fileInsertMultipleLinesToolBox: FileInsertMultipleLinesToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'insert_multiple_lines_to_file',
      description:
        'insert multiple lines to the file with a specific line number, the original line will be pushed down',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to insert a line',
          },
          lineNumber: {
            type: 'number',
            description: 'the line number to insert',
          },
          lines: {
            type: 'string',
            description:
              'the text of multiple lines to insert, each line should be separated by a new line character "\n"',
          },
        },
        required: ['filePath', 'lineNumber', 'lines'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to insert a line'),
    lineNumber: z.number().describe('the line number to insert'),
    lines: z
      .string()
      .describe('the text of multiple lines to insert, each line should be separated by a new line character "\n"'),
  }),
  exec: (p: FileInsertMultipleLinesToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');

    // Validate and safely insert the new line
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    // Adjust for 1-based line numbers
    const targetLine = Math.max(0, Math.min(p.lineNumber - 1, data.length));

    const lines = p.lines.split('\n');

    // Insert the new lines, pushing existing content down
    data.splice(targetLine, 0, ...lines);

    fs.writeFileSync(filePath, data.join('\n'));
    return `${lines.length} Lines inserted successfully`;
  },
};

export const fileSearchToolBox: FileSearchToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'search_file_content',
      description: 'search the content of a file with a query, return the file content with line numbers',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to search',
          },
          query: {
            type: 'string',
            description: 'the query to search in the file content',
          },
        },
        required: ['filePath', 'query'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to search'),
    query: z.string().describe('the query to search in the file content'),
  }),
  exec: (p: FileSearchToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    return data
      .map((line, index) => ({
        lineNumber: index + 1,
        text: line,
      }))
      .filter((line) => line.text.includes(p.query));
  },
};

const tool: Tool = {
  names: [
    'insert_multiple_lines_to_file',
    'search_file_content',
    'edit_file_with_line_number',
    'delete_line_from_file',
    'insert_line_to_file',
    'read_full_file_with_line_numbers',
    'read_part_of_file_with_line_numbers',
    'read_last_several_lines_of_file_with_line_numbers',
  ],
  build: (_p: PromptFile) => {
    return [
      fileInsertMultipleLinesToolBox,
      fileSearchToolBox,
      fileEditToolBox,
      fileDeleteLineToolBox,
      fileInsertLineToolBox,
      fileReadAllToolBox,
      fileReadPartToolBox,
      fileReadLastServalLinesToolBox,
    ];
  },
};

export default tool;
