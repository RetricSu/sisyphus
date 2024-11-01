import { ccc, Client, Hex, NostrEvent } from '@ckb-ccc/core';
import { Network } from '../offckb/offckb.config';
import { Nip07 } from '@ckb-ccc/nip07';
import { NostrProvider } from './NostrProvider';
import { defaultRelays } from './defaultRelays';
import { NostrSigner, Keys, loadWasmSync, Client as NostrClient, Filter, Tag, Metadata } from '@rust-nostr/nostr-sdk';
import { buildCccClient } from './cccClient';
import { TransferOption } from './type';

// Nostr and CKB
export class NosCKB {
  public network: Network;
  private relayList: string[];
  private nostrKeys: Keys;
  private nostrSigner: NostrSigner;
  private nostrClient: NostrClient;
  private cccClient: Client;
  private cccNostrSigner: Nip07.Signer;

  constructor({ nostrPrivkey, network, relays = [] }: { nostrPrivkey: string; network: Network; relays?: string[] }) {
    this.network = network;
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

  async readMentionNotesWithMe() {
    const filter = Filter.fromJson(
      JSON.stringify({
        kinds: [1],
        '#p': [(await this.cccNostrSigner.getNostrPublicKey()).slice(2)],
      }),
    );
    await this.nostrClient.connect();
    const events = await this.nostrClient.getEventsFrom(this.relayList, [filter]);
    return events.map((e) => JSON.parse(e.asJson()) as Required<NostrEvent>);
  }

  async publishReplyNotesToEvent(text: string, eventId: Hex) {
    await this.nostrClient.connect();
    const tag = Tag.parse(['e', eventId.slice(2)]);
    const res = await this.nostrClient.publishTextNote(text, [tag]);
    return { eventId: res.id.toBech32() };
  }

  async publishProfileEvent(
    name: string,
    about: string,
    avatarPictureUrl: string = 'https://image.nostr.build/13ee4c26a7b40da80fd7078cd12621ca072ce09cbd5f1ac081e3300c1639bbfb.jpg',
  ) {
    await this.nostrClient.connect();

    const metadata = new Metadata().name(name).about(about).picture(avatarPictureUrl);

    const res = await this.nostrClient.setMetadata(metadata);
    return { eventId: res.id.toBech32() };
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
