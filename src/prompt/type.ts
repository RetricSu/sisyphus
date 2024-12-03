import { MemoId } from '../memory/type';

// in the future the prompt should be share as a Nostr event across the network
export interface PromptFile {
  name: string;
  description: string;
  memoId: MemoId;
  ckbNetwork: 'devnet' | 'testnet' | 'mainnet';
  tools: string[];
  maxSteps?: number;
  prompts: {
    role: 'system' | 'user';
    content: string;
  }[];
  llm: {
    apiUrl: string;
    model: string;
    provider: 'ollama' | 'openai' | 'anthropic';
    apiKey?: string;
  };
  author?: string;
  tags?: string[];
  nostr?: {
    eventId?: string;
    relays?: string[];
  };
}
