import z from "zod";
import { MemoryManager } from '../memory/memory';
import { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

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

export type MemoryToolReadToolBoxType = ToolBox<[MemoryToolReadParameter], Promise<string>>;
export type MemoryToolCreateToolBoxType = ToolBox<[MemoryToolCreateParameter], Promise<string>>;
export type MemoryToolUpdateToolBoxType = ToolBox<[MemoryToolUpdateParameter], Promise<string>>;
export type MemoryToolDeleteToolBoxType = ToolBox<[MemoryToolDeleteParameter], Promise<string>>;

export const memoryReadToolBox: MemoryToolReadToolBoxType = {
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
    const memoryManager = new MemoryManager();
    const memories = memoryManager.read();
    const memory = memories.find((mem) => mem.id === parameter.id);
    if (memory) {
      return memory.text;
    } else {
      return `Memory with id ${parameter.id} not found`;
    }
  },
};

export const memoryCreateToolBox: MemoryToolCreateToolBoxType = {
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
    const memoryManager = new MemoryManager();
    const newMemory = await memoryManager.create(parameter.text);
    return `Created memory with id ${newMemory.id}`;
  },
};

export const memoryUpdateToolBox: MemoryToolUpdateToolBoxType = {
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
    const memoryManager = new MemoryManager();
    await memoryManager.update(parameter.id, parameter.text);
    return `Updated memory with id ${parameter.id}`;
  },
};

export const memoryDeleteToolBox: MemoryToolDeleteToolBoxType = {
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
    const memoryManager = new MemoryManager();
    await memoryManager.delete(parameter.id);
    return `Deleted memory with id ${parameter.id}`;
  },
};


const tool: Tool = {
    names: [
        'read_memory',
        'create_memory',
        'update_memory',
        'delete_memory',
    ],
    build: (_p: PromptFile) => {
        return [memoryReadToolBox, memoryCreateToolBox, memoryUpdateToolBox, memoryDeleteToolBox];
    }
}

export default tool;
