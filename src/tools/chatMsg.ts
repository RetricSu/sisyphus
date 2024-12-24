import type { Message } from 'ollama';
import z from 'zod';
import { Memory, type MemoryMetadata } from '../memory/long-term';
import { MessageView } from '../memory/message-view';
import { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

export interface SearchChatMsgToolExecParameter {
  text: string;
}

export interface LoadNewestChatMsgToolExecParameter {
  limit: number;
}

export type SearchChatMsgToolBoxType = ToolBox<
  [SearchChatMsgToolExecParameter],
  Promise<(Message & { created_at: string })[]>
>;

export type LoadNewestChatMsgToolBoxType = ToolBox<
  [LoadNewestChatMsgToolExecParameter],
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
  const loadNewestChatMsgToolBox: LoadNewestChatMsgToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'load_newest_chat_messages',
        description: 'Load the newest chat messages',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'The limit of the newest chat messages to load',
            },
          },
          required: ['limit'],
        },
      },
    },
    params: z.object({
      limit: z.number().describe('The limit of the newest chat messages to load'),
    }),
    exec: async ({ limit }: LoadNewestChatMsgToolExecParameter) => {
      const result = MessageView.listLastMessages(memoId, limit);
      return result.map((m) => ({ ...m, created_at: new Date(m.created_at).toISOString() }));
    },
  };
  return [searchChatMsgToolBox, loadNewestChatMsgToolBox];
}

const tool: Tool = {
  names: ['search_chat_messages', 'load_newest_chat_messages'],
  build: (p: PromptFile) => {
    const memoId = p.memoId;
    return buildChatMessageSearchToolBox(memoId);
  },
};

export default tool;
