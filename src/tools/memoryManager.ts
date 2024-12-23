import z from "zod";
import z from \'zod\';\nimport { MemoryManager } from \'../memory/memory\';\nimport { PromptFile } from \'../prompt\';\nimport type { Tool, ToolBox } from \'./type\';\n\nexport interface MemoryToolReadParameter {\n  id: string;\n}\n\nexport interface MemoryToolCreateParameter {\n  text: string;\n}\n\nexport interface MemoryToolUpdateParameter {\n  id: string;\n  text: string;\n}\n\nexport interface MemoryToolDeleteParameter {\n  id: string;\n}\n\nexport type MemoryToolReadToolBoxType = ToolBox<[MemoryToolReadParameter], string>;\nexport type MemoryToolCreateToolBoxType = ToolBox<[MemoryToolCreateParameter], string>;\nexport type MemoryToolUpdateToolBoxType = ToolBox<[MemoryToolUpdateParameter], string>;\nexport type MemoryToolDeleteToolBoxType = ToolBox<[MemoryToolDeleteParameter], string>;\n\n\nexport const memoryReadToolBox: MemoryToolReadToolBoxType = {\n  fi: {\n    type: \'function\',\n    function: {\n      name: \'read_memory\',\n      description: \'read a memory entry by id\',\n      parameters: {\n        type: \'object\',\n        properties: {\n          id: {\n            type: \'string\',\n            description: \'the id of the memory entry to read\',\n          },\n        },\n        required: [\'id\'],\n      },\n    },\n  },\n  params: z.object({\n    id: z.string().describe(\'the id of the memory entry to read\'),\n  }),\n  exec: async (parameter: MemoryToolReadParameter) => {\n    const memoryManager = new MemoryManager();\n    const memories = memoryManager.read();\n    const memory = memories.find((mem) => mem.id === parameter.id);\n    if (memory) {\n      return memory.text;\n    } else {\n      return `Memory with id ${parameter.id} not found`;\n    }\n  },\n};\n\nexport const memoryCreateToolBox: MemoryToolCreateToolBoxType = {\n  fi: {\n    type: \'function\',\n    function: {\n      name: \'create_memory\',\n      description: \'create a new memory entry\',\n      parameters: {\n        type: \'object\',\n        properties: {\n          text: {\n            type: \'string\',\n            description: \'the text of the memory entry to create\',\n          },\n        },\n        required: [\'text\'],\n      },\n    },\n  },\n  params: z.object({\n    text: z.string().describe(\'the text of the memory entry to create\'),\n  }),\n  exec: async (parameter: MemoryToolCreateParameter) => {\n    const memoryManager = new MemoryManager();\n    const newMemory = await memoryManager.create(parameter.text);\n    return `Created memory with id ${newMemory.id}`;\n  },\n};\n\nexport const memoryUpdateToolBox: MemoryToolUpdateToolBoxType = {\n  fi: {\n    type: \'function\',\n    function: {\n      name: \'update_memory\',\n      description: \'update an existing memory entry\',\n      parameters: {\n        type: \'object\',\n        properties: {\n          id: {\n            type: \'string\',\n            description: \'the id of the memory entry to update\',\n          },\n          text: {\n            type: \'string\',\n            description: \'the new text of the memory entry\',\n          },\n        },\n        required: [\'id\', \'text\'],\n      },\n    },\n  },\n  params: z.object({\n    id: z.string().describe(\'the id of the memory entry to update\'),\n    text: z.string().describe(\'the new text of the memory entry\'),\n  }),\n  exec: async (parameter: MemoryToolUpdateParameter) => {\n    const memoryManager = new MemoryManager();\n    await memoryManager.update(parameter.id, parameter.text);\n    return `Updated memory with id ${parameter.id}`;\n  },\n};\n\nexport const memoryDeleteToolBox: MemoryToolDeleteToolBoxType = {\n  fi: {\n    type: \'function\',\n    function: {\n      name: \'delete_memory\',\n      description: \'delete a memory entry by id\',\n      parameters: {\n        type: \'object\',\n        properties: {\n          id: {\n            type: \'string\',\n            description: \'the id of the memory entry to delete\',\n          },\n        },\n        required: [\'id\'],\n      },\n    },\n  },\n  params: z.object({\n    id: z.string().describe(\'the id of the memory entry to delete\'),\n  }),\n  exec: async (parameter: MemoryToolDeleteParameter) => {\n    const memoryManager = new MemoryManager();\n    await memoryManager.delete(parameter.id);\n    return `Deleted memory with id ${parameter.id}`;\n  },\n};\n\n\nconst tool: Tool = {\n    names: [\n        \'read_memory\',\n        \'create_memory\',\n        \'update_memory\',\n        \'delete_memory\',\n    ],\n    build: (_p: PromptFile) => {\n        return [memoryReadToolBox, memoryCreateToolBox, memoryUpdateToolBox, memoryDeleteToolBox];\n    }\n}\n\nexport default tool;
import { PromptFile } from "../prompt";
import type { Tool, ToolBox } from "./type";

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

export type MemoryToolBoxType = ToolBox<
  [
    MemoryToolReadParameter,
    MemoryToolCreateParameter,
    MemoryToolUpdateParameter,
    MemoryToolDeleteParameter
  ],
  string
>;

export const memoryToolBox: MemoryToolBoxType = {
  fi: {
    type: "function",
    function: {
      read: async (parameter: MemoryToolReadParameter) => {
        const memoryManager = new MemoryManager();
        const memories = memoryManager.read();
        const memory = memories.find((mem) => mem.id === parameter.id);
        if (memory) {
          return memory.text;
        } else {
          return `Memory with id ${parameter.id} not found`;
        }
      },
      create: async (parameter: MemoryToolCreateParameter) => {
        const memoryManager = new MemoryManager();
        const newMemory = await memoryManager.create(parameter.text);
        return `Created memory with id ${newMemory.id}`;
      },
      update: async (parameter: MemoryToolUpdateParameter) => {
        const memoryManager = new MemoryManager();
        await memoryManager.update(parameter.id, parameter.text);
        return `Updated memory with id ${parameter.id}`;
      },
      delete: async (parameter: MemoryToolDeleteParameter) => {
        const memoryManager = new MemoryManager();
        await memoryManager.delete(parameter.id);
        return `Deleted memory with id ${parameter.id}`;
      },
    },
  },
};
