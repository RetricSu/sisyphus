import { AvailableToolName, ToolBox } from './type';
import { NosCKB, TransferOption } from '../sdk';
import { readEnvNetwork } from '../offckb/offckb.config';
import { Hex } from '@ckb-ccc/core';
import { Filter } from '@rust-nostr/nostr-sdk';

export function buildNosCKBToolBox(nostrPrivkey: string) {
  const network = readEnvNetwork();
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
        name: AvailableToolName.publishNote,
        description: 'Publish Nip01 Notes to Nostr networks',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'the text content of the Nostr short note to publish',
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
        name: AvailableToolName.readNostrEvents,
        description: 'get nostr events from nostr network with specific filters',
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

  return {
    ckbBalanceToolBox,
    accountInfoToolBox,
    transferCKBToolBox,
    publishNoteToolBox,
    readNostrEvents,
  };
}

export type CKBBalanceToolBoxType = ToolBox<Parameters<NosCKB['getBalance']>, ReturnType<NosCKB['getBalance']>>;
export type PublishNoteToolBoxType = ToolBox<[string], ReturnType<NosCKB['publishNote']>>;
export type TransferCKBToolBoxType = ToolBox<[TransferOption], Promise<{ txHash: Hex }>>;
export type AccountInfoToolBoxType = ToolBox<
  Parameters<NosCKB['getMyAccountInfo']>,
  ReturnType<NosCKB['getMyAccountInfo']>
>;
export type ReadNostrEventsToolBoxType = ToolBox<[string], ReturnType<NosCKB['readNostrEvents']>>;
