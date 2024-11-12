import { AvailableToolName, ToolBox } from './type';
import { HexNoPrefix, NosCKB, TransferOption } from '../sdk';
import { Hex } from '@ckb-ccc/core';
import { Filter } from '@rust-nostr/nostr-sdk';
import { Network } from '../offckb/offckb.config';

export type CKBBalanceToolBoxType = ToolBox<Parameters<NosCKB['getBalance']>, ReturnType<NosCKB['getBalance']>>;
export type PublishNoteToolBoxType = ToolBox<[string], ReturnType<NosCKB['publishNote']>>;
export type TransferCKBToolBoxType = ToolBox<[TransferOption], Promise<{ txHash: Hex }>>;
export type AccountInfoToolBoxType = ToolBox<
  Parameters<NosCKB['getMyAccountInfo']>,
  ReturnType<NosCKB['getMyAccountInfo']>
>;
export type ReadNostrEventsToolBoxType = ToolBox<[string], ReturnType<NosCKB['readNostrEvents']>>;
export type ReadNostrMentionNotesWithMeToolBoxType = ToolBox<[], ReturnType<NosCKB['readMentionNotesWithMe']>>;
export type PublishNostrReplyNotesToEventToolBoxType = ToolBox<
  Parameters<NosCKB['publishReplyNotesToEvent']>,
  ReturnType<NosCKB['publishReplyNotesToEvent']>
>;
export type PublishNostrProfileEventToolBoxType = ToolBox<
  Parameters<NosCKB['publishProfileEvent']>,
  ReturnType<NosCKB['publishProfileEvent']>
>;

export function buildNosCKBToolBox(network: Network, nostrPrivkey: string) {
  const nosCKB = new NosCKB({ network, nostrPrivkey });

  const ckbBalanceToolBox: CKBBalanceToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.getCKBBalance,
        description: 'Get CKB balance from CKB blockchain',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    exec: async () => {
      return await nosCKB.getBalance();
    },
  };

  const publishNoteToolBox: PublishNoteToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.publishNostrSocialPost,
        description: 'Publish Social Post to Nostr networks with Nip-01 Event',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'the text content of the Nostr short post to publish',
            },
          },
          required: ['text'],
        },
      },
    },
    exec: async (text: string) => {
      return await nosCKB.publishNote(text);
    },
  };

  const transferCKBToolBox: TransferCKBToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.transferCKB,
        description: 'Transfer some CKB to a CKB Address',
        parameters: {
          type: 'object',
          properties: {
            toAddress: {
              type: 'string',
              description: 'the receiver CKB address',
            },
            amountInCKB: {
              type: 'string',
              description: 'the amount hex number string of CKB',
            },
            feeRate: {
              type: 'number',
              description: 'the fee rate for the CKB transfer transaction, default to 1000',
            },
          },
          required: ['toAddress', 'amountInCKB'],
        },
      },
    },
    exec: async (opt: TransferOption) => {
      const txHash = await nosCKB.transfer(opt);
      return { txHash };
    },
  };

  const accountInfoToolBox: AccountInfoToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.getMyAccountInfo,
        description: 'get the CKB Address and Nostr publickey information',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    exec: async () => {
      return await nosCKB.getMyAccountInfo();
    },
  };

  const readNostrEvents: ReadNostrEventsToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.readSocialPostOnNostrWithFilter,
        description: 'get nostr social post from nostr network with specific filters',
        parameters: {
          type: 'object',
          properties: {
            kind: {
              type: 'string',
              description: 'event kind to fetch',
            },
          },
          required: ['kind'],
        },
      },
    },
    exec: async (kind: string) => {
      const f = {
        kinds: [+kind],
      };
      const filter = Filter.fromJson(JSON.stringify(f));
      return await nosCKB.readNostrEvents([filter]);
    },
  };

  const readMentionNotesWithMe: ReadNostrMentionNotesWithMeToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.readSocialNotificationMessageOnNostr,
        description: 'get social notification message (mention-me or reply-to-me posts) from nostr network',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    exec: async () => {
      return await nosCKB.readMentionNotesWithMe();
    },
  };

  const publishReplyNotesToEvent: PublishNostrReplyNotesToEventToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.publishReplyPostToOtherOnNostr,
        description: 'publish a reply post to a specific post(a nostr event) in nostr network',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'the reply content text',
            },
            eventId: {
              type: 'string',
              description: 'the id of the event to reply, hex string',
            },
          },
          required: ['text', 'eventId'],
        },
      },
    },
    exec: async (text: string, eventId: HexNoPrefix) => {
      return await nosCKB.publishReplyNotesToEvent(text, eventId);
    },
  };

  const publishProfileEvent: PublishNostrProfileEventToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.updateSocialProfileOnNostr,
        description: 'publish a profile metadata event in nostr network',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'the name of your nostr account profile',
            },
            about: {
              type: 'string',
              description: 'the introduction/about me/description of yourself in the nostr account profile',
            },
            avatarPictureUrl: {
              type: 'string',
              description: 'the avatar picture url of your nostr profile',
            },
          },
          required: ['name', 'about'],
        },
      },
    },
    exec: async (name: string, about: string, avatarPictureUrl?: string) => {
      return await nosCKB.publishProfileEvent(name, about, avatarPictureUrl);
    },
  };

  return {
    ckbBalanceToolBox,
    accountInfoToolBox,
    transferCKBToolBox,
    publishNoteToolBox,
    readNostrEvents,
    readMentionNotesWithMe,
    publishReplyNotesToEvent,
    publishProfileEvent,
  };
}
