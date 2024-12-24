import z from 'zod';
import { Memory, MemoryManager } from '../memory/memory';
import { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

export interface MemoryToolLoadParameter {
  limit?: number;
}

export interface MemoryToolReadParameter {
  id: string;
}

export interface MemoryToolCreateParameter {
  text: string;
}

export interface MemoryToolUpdateParameter {
  id: string;
  text: string;
}

export interface MemoryToolDeleteParameter {
  id: string;
}
export interface MemoryToolSearchParameter {
  text: string;
}

export type MemoryToolLoadToolBoxType = ToolBox<[MemoryToolLoadParameter], Promise<Memory[]>>;
export type MemoryToolSearchToolBoxType = ToolBox<[MemoryToolSearchParameter], Promise<Memory[]>>;
export type MemoryToolReadToolBoxType = ToolBox<[MemoryToolReadParameter], Promise<string>>;
export type MemoryToolCreateToolBoxType = ToolBox<[MemoryToolCreateParameter], Promise<string>>;
export type MemoryToolUpdateToolBoxType = ToolBox<[MemoryToolUpdateParameter], Promise<string>>;
export type MemoryToolDeleteToolBoxType = ToolBox<[MemoryToolDeleteParameter], Promise<string>>;

export function buildMemoryManagerToolBox(memoId: string) {
  const memoryManager = new MemoryManager(memoId);

  const memoryToolLoadToolBoxType: MemoryToolLoadToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'load_memory',
        description: 'load memory entries with entry limit, if the limit is not set, load all entries',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'the limit of the memory entries to load',
            },
          },
          required: [],
        },
      },
    },
    params: z.object({}),
    exec: async (p: MemoryToolLoadParameter) => {
      memoryManager.load();
      const memories = memoryManager.read();
      if (p.limit && p.limit > memories.length) {
        return memories;
      }

      return memories.slice(memories.length - (p.limit ?? memories.length));
    },
  };

  const memoryReadToolBox: MemoryToolReadToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'read_memory',
        description: 'read a memory entry by id',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'the id of the memory entry to read',
            },
          },
          required: ['id'],
        },
      },
    },
    params: z.object({
      id: z.string().describe('the id of the memory entry to read'),
    }),
    exec: async (parameter: MemoryToolReadParameter) => {
      memoryManager.load();
      const memories = memoryManager.read();
      const memory = memories.find((mem) => mem.id === parameter.id);
      if (memory) {
        return memory.text;
      } else {
        return `Memory with id ${parameter.id} not found`;
      }
    },
  };

  const memoryCreateToolBox: MemoryToolCreateToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'create_memory',
        description: 'create a new memory entry',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'the text of the memory entry to create',
            },
          },
          required: ['text'],
        },
      },
    },
    params: z.object({
      text: z.string().describe('the text of the memory entry to create'),
    }),
    exec: async (parameter: MemoryToolCreateParameter) => {
      memoryManager.load();
      const newMemory = await memoryManager.create(parameter.text);
      return `Created memory with id ${newMemory.id}`;
    },
  };

  const memoryUpdateToolBox: MemoryToolUpdateToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'update_memory',
        description: 'update an existing memory entry',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'the id of the memory entry to update',
            },
            text: {
              type: 'string',
              description: 'the new text of the memory entry',
            },
          },
          required: ['id', 'text'],
        },
      },
    },
    params: z.object({
      id: z.string().describe('the id of the memory entry to update'),
      text: z.string().describe('the new text of the memory entry'),
    }),
    exec: async (parameter: MemoryToolUpdateParameter) => {
      memoryManager.load();
      await memoryManager.update(parameter.id, parameter.text);
      return `Updated memory with id ${parameter.id}`;
    },
  };

  const memoryDeleteToolBox: MemoryToolDeleteToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'delete_memory',
        description: 'delete a memory entry by id',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'the id of the memory entry to delete',
            },
          },
          required: ['id'],
        },
      },
    },
    params: z.object({
      id: z.string().describe('the id of the memory entry to delete'),
    }),
    exec: async (parameter: MemoryToolDeleteParameter) => {
      memoryManager.load();
      await memoryManager.delete(parameter.id);
      return `Deleted memory with id ${parameter.id}`;
    },
  };

  const memorySearchToolBox: MemoryToolSearchToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'search_memory',
        description: 'search a memory entry by text',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'the text of the memory entry to search',
            },
          },
          required: ['text'],
        },
      },
    },
    params: z.object({
      text: z.string().describe('the text of the memory entry to search'),
    }),
    exec: async (parameter: MemoryToolSearchParameter) => {
      memoryManager.load();
      const memories = await memoryManager.search(parameter.text);
      return memories;
    },
  };

  return [
    memorySearchToolBox,
    memoryToolLoadToolBoxType,
    memoryReadToolBox,
    memoryCreateToolBox,
    memoryUpdateToolBox,
    memoryDeleteToolBox,
  ];
}

const tool: Tool = {
  names: ['search_memory', 'read_memory', 'create_memory', 'update_memory', 'delete_memory'],
  build: (p: PromptFile) => {
    return buildMemoryManagerToolBox(p.memoId);
  },
};

export default tool;
