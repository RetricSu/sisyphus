import { Tool as OllamaTool } from 'ollama';

export enum AvailableToolName {
  getCurrentTimeFromOs = 'get_current_time_from_os',
  callTerminalSimulator = 'call_terminal_simulator',
  readWebpageContent = 'read_webpage_content',
  getCKBBalance = 'get_ckb_balance',
  transferCKB = 'transfer_ckb',
  getMyAccountInfo = 'get_my_account_info',
  publishNostrSocialPost = 'publish_nostr_social_post',
  readSocialPostOnNostrWithFilter = 'read_social_post_on_nostr_with_filters',
  readSocialNotificationMessageOnNostr = 'read_social_notification_message_on_nostr',
  publishReplyPostToOtherOnNostr = 'publish_reply_post_to_other_on_nostr',
  updateSocialProfileOnNostr = 'update_social_profile_on_nostr',
  searchMemory = 'search_memory',
}

export interface ToolBox<T extends any[] = any[], R = any> {
  fi: ToolInterface;
  exec: (...args: T) => R;
}

export type ToolBoxSet = Record<AvailableToolName, ToolBox>;

export type ToolInterface = OllamaTool;
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
