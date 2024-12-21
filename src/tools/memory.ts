import type { Message } from "ollama";
import z from "zod";
import { Memory, type MemoryMetadata } from "../memory/long-term";
import type { ToolBox } from "./type";

export interface MemoryToolExecParameter {
  text: string;
}

export type MemoryToolBoxType = ToolBox<
  [MemoryToolExecParameter],
  Promise<(Message & { created_at: string })[]>
>;

export function buildMemoryToolBox(memoId: string) {
  const memoryToolBox: MemoryToolBoxType = {
    fi: {
      type: "function",
      function: {
        name: "search_memory",
        description:
          "Search the remembered and maybe-related content from the persistent memory",
        parameters: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The text to search in the memory",
            },
          },
          required: ["text"],
        },
      },
    },
    params: z.object({
      text: z.string().describe("The text to search in the memory"),
    }),
    exec: async ({ text }: MemoryToolExecParameter) => {
      const memory = new Memory(memoId);
      const results = await memory.query({ searchString: text, limit: 5 });
      const msg: (Message & { created_at: string })[] = [];
      const documents = results.documents[0];
      const metadatas = results.metadatas[0];
      for (let index = 0; index < documents.length; index++) {
        const content = documents[index]!;
        const metadata = metadatas[index] as unknown as MemoryMetadata;
        msg.push({
          role: metadata.role,
          content,
          created_at: new Date(metadata.created_at).toISOString(),
        });
      }
      return msg;
    },
  };
  return memoryToolBox;
}
