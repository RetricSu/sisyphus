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

export interface SingleFileTextSearchResult {
  lineNumber: number;
  text: string;
}

export interface CodebaseTextSearchResult {
  filePath: string;
  results: SingleFileTextSearchResult[];
}

export type FileEditPatchesToolExecParameter = {
  filePath: string;
  patches: {
    startLineNumber: number;
    endLineNumber: number;
    text: string;
  }[];
};

export type FileReplaceLineToolExecParameter = {
  filePath: string;
  replaces: {
    lineNumber: number;
    text: string;
  }[];
};

export type FileDeleteLineToolExecParameter = {
  filePath: string;
  lineNumbers: number[];
};

export type FileInsertLineToolExecParameter = {
  filePath: string;
  inserts: {
    lineNumber: number;
    text: string;
  }[];
};

export type FileReadAllToolExecParameter = {
  filePath: string;
};

export type FileReadPartToolExecParameter = {
  filePath: string;
  startLine: number;
  endLine: number;
};

export type FileReadLastPartToolExecParameter = {
  filePath: string;
  lines: number;
};
export type FileWriteAllToolExecParameter = {
  filePath: string;
  fullText: string;
};

export type FileTextSearchToolExecParameter = {
  filePath: string;
  query: string;
};

export type CodebaseTextSearchToolExecParameter = {
  codeBaseFolder: string;
  query: string;
  filePatterns: string[];
  fileExcludePatterns?: string[];
};

export type FileReplaceLineToolBoxType = ToolBox<[FileReplaceLineToolExecParameter], string>;
export type FileEditPatchesToolBoxType = ToolBox<[FileEditPatchesToolExecParameter], string>;
export type FileDeleteLineToolBoxType = ToolBox<[FileDeleteLineToolExecParameter], string>;
export type FileInsertLineToolBoxType = ToolBox<[FileInsertLineToolExecParameter], string>;
export type FileReadAllToolBoxType = ToolBox<[FileReadAllToolExecParameter], ReadFileLineResult>;
export type FileReadPartToolBoxType = ToolBox<[FileReadPartToolExecParameter], ReadFileLineResult>;
export type FileReadLastPartToolBoxType = ToolBox<[FileReadLastPartToolExecParameter], ReadFileLineResult>;
export type FileWriteAllToolBoxType = ToolBox<[FileWriteAllToolExecParameter], string>;
export type FileTextSearchToolBoxType = ToolBox<[FileTextSearchToolExecParameter], SingleFileTextSearchResult[]>;
export type CodebaseTextSearchToolBoxType = ToolBox<[CodebaseTextSearchToolExecParameter], CodebaseTextSearchResult[]>;

export const fileReplaceLineToolBox: FileReplaceLineToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'replace_line_in_file',
      description: 'replace lines in the file with specific line numbers',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to edit',
          },
          // array type not supported for now
          replaces: {
            type: 'array',
            description: 'the lines to replace',
          },
        },
        required: ['filePath', 'replaces'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to edit'),
    replaces: z
      .array(
        z.object({
          lineNumber: z.number().describe('the line number to replace'),
          text: z.string().describe('the text to replace the line'),
        }),
      )
      .describe('Array of lines to replace'),
  }),
  exec: (p: FileReplaceLineToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const replace of p.replaces) {
      // Adjust for 1-based line numbers
      data[replace.lineNumber - 1] = replace.text;
    }
    fs.writeFileSync(filePath, data.join('\n'));
    return `${p.replaces.length} Line(s) replaced.`;
  },
};

export const fileEditPatchesToolBox: FileEditPatchesToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'edit_text_in_file_with_patches',
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
          text: z
            .string()
            .describe(
              'text to replace the lines, new line characters should be used to separate lines, eg: "line1\nline2\nline3"',
            ),
        }),
      )
      .describe(
        'Array of patches to apply, must be sorted by startLineNumber in ascending order to ensure correct application',
      ),
  }),
  exec: (p: FileEditPatchesToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');

    for (const patch of p.patches.sort((a, b) => b.startLineNumber - a.startLineNumber)) {
      // sort in desc order to avoid index shift
      // Adjust for 1-based line numbers
      const startLine = Math.max(0, Math.min(patch.startLineNumber - 1, data.length));
      const endLine = Math.max(0, Math.min(patch.endLineNumber, data.length));

      data.splice(startLine, endLine - startLine, ...patch.text.split('\n'));
      fs.writeFileSync(filePath, data.join('\n'));
    }

    return `${p.patches.length} Patches applied.`;
  },
};

export const fileDeleteLineToolBox: FileDeleteLineToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'delete_line_in_file',
      description: 'delete lines in the file with specific line numbers',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to delete a line',
          },
          lineNumbers: {
            type: 'array',
            description: 'the lines to delete',
          },
        },
        required: ['filePath', 'lineNumbers'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to delete a line'),
    lineNumbers: z.array(z.number()).describe('the lines to delete'),
  }),
  exec: (p: FileDeleteLineToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const lineNumber of p.lineNumbers) {
      // Adjust for 1-based line numbers
      data.splice(lineNumber - 1, 1);
    }
    fs.writeFileSync(filePath, data.join('\n'));
    return `${p.lineNumbers.length} Line(s) deleted.`;
  },
};

export const fileInsertLineToolBox: FileInsertLineToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'insert_line_to_file',
      description: 'insert lines to a file, the original line will be pushed down',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'the file path to insert a line',
          },
          inserts: {
            type: 'array',
            description: 'the new lines to insert',
          },
        },
        required: ['filePath', 'inserts'],
      },
    },
  },
  params: z.object({
    filePath: z.string().describe('the file path to insert a line'),
    inserts: z
      .array(
        z.object({
          lineNumber: z.number().describe('the line number to insert'),
          text: z.string().describe('the text to insert'),
        }),
      )
      .describe('Array of lines to insert'),
  }),
  exec: (p: FileInsertLineToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');

    // Validate and safely insert the new line
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    for (const insert of p.inserts) {
      // Adjust for 1-based line numbers
      const targetLine = Math.max(0, Math.min(insert.lineNumber - 1, data.length));

      // Ensure text is a string
      const textToInsert = insert.text ?? '';

      // Insert the new line, pushing existing content down
      data.splice(targetLine, 0, textToInsert);
    }

    fs.writeFileSync(filePath, data.join('\n'));
    return `${p.inserts.length} Line(s) inserted.`;
  },
};

export const fileReadAllToolBox: FileReadAllToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_full_file',
      description: 'read the full content of a file',
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
      name: 'read_part_of_file',
      description: 'read part of the content of a file',
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

export const fileReadLastPartToolBox: FileReadLastPartToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_last_part_of_file',
      description: 'read the last part of the content of a file',
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
  exec: (p: FileReadLastPartToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = fs.readFileSync(filePath, 'utf8').split('\n');
    return {
      startLineNumber: data.length - p.lines + 1,
      endLineNumber: data.length,
      text: data.slice(-p.lines).join('\n'),
    };
  },
};

export const fileWriteAllToolBox: FileWriteAllToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'write_full_file',
      description: 'write the full content to a file',
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
              'the full text to write to the file, if the file contains original content, it will be cleared and replaced',
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
  exec: (p: FileWriteAllToolExecParameter) => {
    const filePath = sanitizeFullFilePath(p.filePath);
    const data = p.fullText.split('\n');
    const totalLines = data.length;
    fs.writeFileSync(filePath, p.fullText);
    return `${totalLines} Line(s) written.`;
  },
};

export const fileTextSearchToolBox: FileTextSearchToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'search_file_content',
      description: 'search the content of a file with a query text',
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
  exec: (p: FileTextSearchToolExecParameter) => {
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

export const codebaseTextSearchToolBox: CodebaseTextSearchToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'search_text_in_codebase',
      description: 'search text across files in the codebase',
      parameters: {
        type: 'object',
        properties: {
          codeBaseFolder: {
            type: 'string',
            description: 'the codebase folder to search within',
          },
          query: {
            type: 'string',
            description: 'the search query',
          },
          filePatterns: {
            type: 'array',
            description: 'the file patterns to search within, eg: ["*.js", "*.ts"]',
          },
          fileExcludePatterns: {
            type: 'array',
            description: 'the file patterns to exclude from search, eg: ["*.test.js"]',
          },
        },
        required: ['codeBaseFolder', 'query', 'filePatterns'],
      },
    },
  },
  params: z.object({
    codeBaseFolder: z.string().describe('the codebase folder to search within'),
    query: z.string().describe('the search query'),
    filePatterns: z.array(z.string()).describe('the file patterns to search within, eg: ["*.js", "*.ts"]'),
    fileExcludePatterns: z
      .array(z.string())
      .optional()
      .describe('the file patterns to exclude from search, eg: ["*.test.js"]'),
  }),
  exec: (p: CodebaseTextSearchToolExecParameter) => {
    const results: CodebaseTextSearchResult[] = [];
    const fileExcludePatterns = p.fileExcludePatterns ?? [];
    const files = p.filePatterns.flatMap((pattern) => {
      return fs
        .readdirSync(sanitizeFullFilePath(p.codeBaseFolder))
        .filter((file) => file.match(new RegExp(pattern)) && !fileExcludePatterns.includes(file))
        .map((file) => `${p.codeBaseFolder}/${file}`);
    });
    files.forEach((file) => {
      const data = fs.readFileSync(file, 'utf8').split('\n');
      data.forEach((line, index) => {
        if (line.includes(p.query)) {
          results.push({
            filePath: file,
            results: [
              {
                lineNumber: index + 1,
                text: line,
              },
            ],
          });
        }
      });
    });
    return results;
  },
};

const toolList = [
  fileReplaceLineToolBox,
  fileDeleteLineToolBox,
  fileInsertLineToolBox,
  fileReadAllToolBox,
  fileReadPartToolBox,
  fileReadLastPartToolBox,
  fileEditPatchesToolBox,
  fileWriteAllToolBox,
  fileTextSearchToolBox,
  codebaseTextSearchToolBox,
];

const tool: Tool = {
  names: toolList.map((t) => t.fi.function.name),
  build: (_p: PromptFile) => {
    return toolList;
  },
};

export default tool;
