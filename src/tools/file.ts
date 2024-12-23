import fs from 'fs';
import z from 'zod';
import { PromptFile } from '../prompt';
import { sanitizeFullFilePath } from '../util/fs';
import type { Tool, ToolBox } from './type';

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

export type FileEditToolBoxType = ToolBox<[FileEditToolExecParameter], string>;

export type FileDeleteLineToolBoxType = ToolBox<[FileDeleteLineToolExecParameter], string>;

export type FileInsertLineToolBoxType = ToolBox<[FileInsertLineToolExecParameter], string>;

export type FileReadAllToolBoxType = ToolBox<[FileReadAllToolExecParameter], string>;

export type FileReadPartToolBoxType = ToolBox<[FileReadPartToolExecParameter], string>;

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
    data[p.lineNumber] = p.text;
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
    data.splice(p.lineNumber, 1);
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

    // Ensure line number is within bounds
    const targetLine = Math.max(0, Math.min(p.lineNumber, data.length));

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
    return data.map((line, index) => `${index + 1}: ${line}`).join('\n');
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
    return data
      .slice(p.startLine - 1, p.endLine)
      .map((line, index) => `${index + p.startLine}: ${line}`)
      .join('\n');
  },
};

const tool: Tool = {
  names: [
    'edit_file_with_line_number',
    'delete_line_from_file',
    'insert_line_to_file',
    'read_full_file_with_line_numbers',
    'read_part_of_file_with_line_numbers',
  ],
  build: (_p: PromptFile) => {
    return [fileEditToolBox, fileDeleteLineToolBox, fileInsertLineToolBox, fileReadAllToolBox, fileReadPartToolBox];
  },
};

export default tool;
