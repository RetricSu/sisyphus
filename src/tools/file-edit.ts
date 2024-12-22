import fs from 'fs';
import z from 'zod';
import type { ToolBox } from './type';
import { sanitizeFullFilePath } from '../util/fs';

export type FileEditToolExecParameter = {
  filePath: string;
  lineNumber: number;
  text: string;
};

export type FileReadToolExecParameter = {
  filePath: string;
};

export type FileEditToolBoxType = ToolBox<[FileEditToolExecParameter], string>;

export type FileReadToolBoxType = ToolBox<[FileReadToolExecParameter], string>;

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

export const fileReadToolBox: FileReadToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_file_with_line_numbers',
      description: 'read the content of a file, return the file content with line numbers',
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
  exec: (p: FileReadToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    return data.map((line, index) => `${index + 1}: ${line}`).join('\n');
  },
};

export function buildFileEditToolBox() {
  return [fileEditToolBox, fileReadToolBox];
}

