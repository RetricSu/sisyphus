import { Tool as ToolInterface } from 'ollama';

export enum AvailableToolName {
  getTimestampFromOs = 'get_timestamp_from_os',
  callTerminalSimulator = 'call_terminal_simulator',
  readWebpageContent = 'read_webpage_content',
  getCKBBalance = 'get_ckb_balance',
  publishNote = 'publish_note',
  transferCKB = 'transfer_ckb',
  getMyAccountInfo = 'get_my_account_info',
  readNostrEvents = 'read_nostr_events',
  readMentionNotesWithMe = 'read_mention_notes_with_me',
  publishReplyNotesToEvent = 'publish_replay_notes_to_event',
  publishProfileEvent = 'publish_profile_event',
}

export interface ToolBox<T extends any[] = any[], R = any> {
  fi: ToolInterface;
  exec: (...args: T) => R;
}

export type ToolBoxSet = Record<AvailableToolName, ToolBox>;

export interface ToolCallRequest {
  name: string;
  parameters: {
    [key: string]: string;
  };
}

export interface ToolCallResponse {
  status: 'failed' | 'success';
  name: AvailableToolName;
  terminalCommand?: string;
  result?: unknown;
  error?: string;
}
