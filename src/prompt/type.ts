import { MemoId } from "../memory/type";

// in the future the prompt should be share as a Nostr event across the network
export interface PromptFile {
  name: string;
  description: string;
  role: 'system' | 'user';
  content: string;
  memoId: MemoId;
  author?: string;
  tags?: string[];
  nostr?: {
    eventId: string;
    relays: string[];
  };
}
