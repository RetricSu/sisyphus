import { MemoId } from '../memory/type';

// in the future the prompt should be share as a Nostr event across the network
export interface PromptFile {
  name: string;
  description: string;
  memoId: MemoId;
  ckbNetwork: 'devnet' | 'testnet' | 'mainnet';
  tools: string[];
  maxSteps?: number;
  twitter?: {
    username: string;
    password: string;
  };
  strategy?: {
    type: 'cot' | 'react' | 'tot' | 'lats';
    maxLoop?: number;
  };
  llm: {
    apiUrl: string;
    model: string;
    provider: 'ollama' | 'openai' | 'anthropic';
    apiKey?: string;
  };
  prompts: {
    role: 'system' | 'user';
    content: string;
  }[];
  author?: string;
  tags?: string[];
  nostr?: {
    eventId?: string;
    relays?: string[];
  };
}
