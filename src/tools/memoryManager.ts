
import z from 'zod';
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
 
export type MemoryToolBoxType = ToolBox<\n  [MemoryToolReadParameter, MemoryToolCreateParameter, MemoryToolUpdateParameter, MemoryToolDeleteParameter],\n  string\n>;\n\nexport const memoryToolBox: MemoryToolBoxType = {\n  fi: {\n    type: 'function',\n    function: {\n      read: async (parameter: MemoryToolReadParameter) => {\n        const memoryManager = new MemoryManager();\n        const memories = memoryManager.read();\n        const memory = memories.find((mem) => mem.id === parameter.id);\n        if (memory) {\n          return memory.text;\n        } else {\n          return `Memory with id ${parameter.id} not found`;\n        }\n      },\n      create: async (parameter: MemoryToolCreateParameter) => {\n        const memoryManager = new MemoryManager();\n        const newMemory = await memoryManager.create(parameter.text);\n        return `Created memory with id ${newMemory.id}`;\n      },\n      update: async (parameter: MemoryToolUpdateParameter) => {\n        const memoryManager = new MemoryManager();\n        await memoryManager.update(parameter.id, parameter.text);\n        return `Updated memory with id ${parameter.id}`;\n      },\n      delete: async (parameter: MemoryToolDeleteParameter) => {\n        const memoryManager = new MemoryManager();\n        await memoryManager.delete(parameter.id);\n        return `Deleted memory with id ${parameter.id}`;\n      },\n    },\n  },\n};