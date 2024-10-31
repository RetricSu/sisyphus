import { ccc, Client, NostrEvent } from '@ckb-ccc/core';
import { Network } from '../offckb/offckb.config';
import { Nip07 } from '@ckb-ccc/nip07';
import { NostrProvider } from './NostrProvider';
import { defaultRelays } from './defaultRelays';
import { NostrSigner, Keys, loadWasmSync, Client as NostrClient, Filter } from '@rust-nostr/nostr-sdk';
import { buildCccClient } from './cccClient';
import { TransferOption } from './type';

// Nostr and CKB
export class NosCKB {
  private relayList: string[];
  private nostrKeys: Keys;
  private nostrSigner: NostrSigner;
  private nostrClient: NostrClient;
  private cccClient: Client;
  private cccNostrSigner: Nip07.Signer;

  constructor({ nostrPrivkey, network, relays = [] }: { nostrPrivkey: string; network: Network; relays?: string[] }) {
    this.cccClient = buildCccClient(network);

    loadWasmSync();
    const keys = Keys.parse(nostrPrivkey);
    this.nostrKeys = keys;
    this.nostrSigner = NostrSigner.keys(keys);
    const relayList = [...defaultRelays, ...relays];
    this.relayList = relayList;
    this.nostrClient = new NostrClient(this.nostrSigner);
    for (const relay of relayList) {
      this.nostrClient.addRelay(relay);
    }

    const provider = new NostrProvider(nostrPrivkey);
    this.cccNostrSigner = new Nip07.Signer(this.cccClient, provider);
  }

  async publishNote(text: string) {
    await this.nostrClient.connect();
    const res = await this.nostrClient.publishTextNote(text, []);
    return { eventId: res.id.toBech32() };
  }

  async readNostrEvents(filters: Filter[]) {
    await this.nostrClient.connect();
    const events = await this.nostrClient.getEventsFrom(this.relayList, filters);
    return events.map((e) => JSON.parse(e.asJson()) as Required<NostrEvent>);
  }

  async transfer({ toAddress, amountInCKB, feeRate = 1000 }: TransferOption) {
    const to = await ccc.Address.fromString(toAddress, this.cccClient);
    const tx = ccc.Transaction.from({
      outputs: [
        {
          capacity: ccc.fixedPointFrom(amountInCKB),
          lock: to.script,
        },
      ],
    });
    await tx.completeInputsByCapacity(this.cccNostrSigner);
    await tx.completeFeeBy(this.cccNostrSigner, feeRate);
    const txHash = await this.cccNostrSigner.sendTransaction(tx);
    return txHash;
  }

  async getMyAccountInfo() {
    const addresses = await this.cccNostrSigner.getAddressObjs();
    const ckbAddress = addresses[0].toString();
    const npubKey = this.nostrKeys.publicKey.toBech32();
    return {
      ckbAddress,
      nostrPubkey: npubKey,
    };
  }

  async getBalance() {
    const addresses = await this.cccNostrSigner.getAddressObjs();
    const shannon = await this.cccClient.getBalanceSingle(addresses[0].script);
    return ccc.fixedPointToString(shannon);
  }
}
