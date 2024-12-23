import type { Message } from 'ollama';
import z from 'zod';
import { Memory, type MemoryMetadata } from '../memory/long-term';
import { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

export interface SearchChatMsgToolExecParameter {
  text: string;
}

export type SearchChatMsgToolBoxType = ToolBox<
  [SearchChatMsgToolExecParameter],
  Promise<(Message & { created_at: string })[]>
>;

export function buildChatMessageSearchToolBox(memoId: string) {
  const searchChatMsgToolBox: SearchChatMsgToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'search_chat_messages',
        description: 'Search the remembered and maybe-related content from the persistent chat message database',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to search in the chat-messages',
            },
          },
          required: ['text'],
        },
      },
    },
    params: z.object({
      text: z.string().describe('The text to search in the chat-messages'),
    }),
    exec: async ({ text }: SearchChatMsgToolExecParameter) => {
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
  return searchChatMsgToolBox;
}

const tool: Tool = {
  names: ['search_chat_messages'],
  build: (p: PromptFile) => {
    const memoId = p.memoId;
    return [buildChatMessageSearchToolBox(memoId)];
  },
};

export default tool;
