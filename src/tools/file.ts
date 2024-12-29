import fs from 'fs';
import z from 'zod';
import { PromptFile } from '../prompt';
import { sanitizeFullFilePath } from '../util/fs';
import type { Tool, ToolBox } from './type';

export interface ReadFileLineResult {
  startLineNumber: number;
  endLineNumber: number;
  text: string;
}

export interface FileTextSearchResult {
  lineNumber: number;
  text: string;
}

export type FileEditToolExecParameter = {
  filePath: string;
  lineNumber: number;
  text: string;
};

export type FileEditMultiplePatchesToolExecParameter = {
  filePath: string;
  patches: {
    startLineNumber: number;
    endLineNumber: number;
    textArray: string[];
  }[];
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

export type WriteFileToolExecParameter = {
  filePath: string;
  fullText: string;
};

export type FileEditToolBoxType = ToolBox<[FileEditToolExecParameter], string>;

export type FileEditMultiplePatchesToolBoxType = ToolBox<[FileEditMultiplePatchesToolExecParameter], string>;

export type FileDeleteLineToolBoxType = ToolBox<[FileDeleteLineToolExecParameter], string>;

export type FileInsertMultipleLinesToolBoxType = ToolBox<[FileInsertMultipleLinesToolExecParameter], string>;
export type FileInsertLineToolBoxType = ToolBox<[FileInsertLineToolExecParameter], string>;

export type FileReadAllToolBoxType = ToolBox<[FileReadAllToolExecParameter], ReadFileLineResult>;

export type FileReadPartToolBoxType = ToolBox<[FileReadPartToolExecParameter], ReadFileLineResult>;

export type FileSearchToolBoxType = ToolBox<[FileSearchToolExecParameter], FileTextSearchResult[]>;

export type FileReadLastServalLinesToolBoxType = ToolBox<
  [FileReadLastServalLinesToolExecParameter],
  ReadFileLineResult
>;

export type WriteFileToolBoxType = ToolBox<[WriteFileToolExecParameter], string>;

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

export const fileEditMultiplePatchesToolBox: FileEditMultiplePatchesToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'edit_multiple_patches_in_file',
      description: 'edit text in the file with a set of patches across multiple lines',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to edit',
          },
          patches: {
            type: 'array',
            description: 'the patches to edit',
          },
        },
        required: ['filePath', 'patches'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('Absolute or relative path to the file that needs to be edited'),
    patches: z
      .array(
        z.object({
          startLineNumber: z.number().describe('Starting line number where the patch should begin (1-based indexing)'),
          endLineNumber: z
            .number()
            .describe('Ending line number where the patch should end (1-based indexing, inclusive)'),
          textArray: z
            .string()
            .array()
            .describe(
              'Array of strings, each string representing a line to insert. Each string should not contain any escaping characters.',
            ),
        }),
      )
      .describe(
        'Array of patches to apply, must be sorted by startLineNumber in ascending order to ensure correct application',
      ),
  }),
  exec: (p: FileEditMultiplePatchesToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');

    for (const patch of p.patches.sort((a, b) => b.startLineNumber - a.startLineNumber)) {
      // sort in desc order to avoid index shift
      // Adjust for 1-based line numbers
      const startLine = Math.max(0, Math.min(patch.startLineNumber - 1, data.length));
      const endLine = Math.max(0, Math.min(patch.endLineNumber, data.length));

      data.splice(startLine, endLine - startLine, ...patch.textArray);
      fs.writeFileSync(filePath, data.join('\n'));
    }

    return `${p.patches.length} Patches applied successfully`;
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
    return {
      startLineNumber: 1,
      endLineNumber: data.length,
      text: data.join('\n'),
    };
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
    return {
      startLineNumber: p.startLine,
      endLineNumber: p.endLine,
      text: data.slice(p.startLine - 1, p.endLine).join('\n'),
    };
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
    return {
      startLineNumber: data.length - p.lines + 1,
      endLineNumber: data.length,
      text: data.slice(-p.lines).join('\n'),
    };
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
              'the text of multiple lines to insert, each line should be separated by a special character "<=*=>"',
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
      .describe('the text of multiple lines to insert, each line should be separated by a new line character "<=*=>"'),
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

    const lines = p.lines.split('<=*=>');

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

export const writeFileToolBox: WriteFileToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'write full text to a file',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to write',
          },
          fullText: {
            type: 'string',
            description:
              'the full text to write to the file, must be surrounded by markdown code block, eg: ```js ... ```',
          },
        },
        required: ['filePath', 'fullText'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to write'),
    fullText: z.string().describe('the full text to write to the file'),
  }),
  exec: (p: WriteFileToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const codeBlockRegex = /```(?:\w+)?\n?([\s\S]+?)\n?```/g;
    const match = codeBlockRegex.exec(p.fullText);
    if (!match) {
      throw new Error('Full text must be surrounded by markdown code block, eg: ```js ... ```');
    }
    const content = match[1];
    fs.writeFileSync(filePath, content);
    return 'File written successfully';
  },
};

const toolList = [
  fileInsertMultipleLinesToolBox,
  fileSearchToolBox,
  fileEditToolBox,
  fileDeleteLineToolBox,
  fileInsertLineToolBox,
  fileReadAllToolBox,
  fileReadPartToolBox,
  fileReadLastServalLinesToolBox,
  fileEditMultiplePatchesToolBox,
  writeFileToolBox,
];

const tool: Tool = {
  names: toolList.map((t) => t.fi.function.name),
  build: (_p: PromptFile) => {
    return toolList;
  },
};

export default tool;
