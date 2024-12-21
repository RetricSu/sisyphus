import type { NostrEvent } from '@ckb-ccc/core';
import { EventBuilder, Keys, Kind, NostrSigner, Tag, loadWasmSync } from '@rust-nostr/nostr-sdk';

export interface Provider {
  getPublicKey(): Promise<string>;
  signEvent(event: NostrEvent): Promise<Required<NostrEvent>>;
}

export class NostrProvider implements Provider {
  private nostrSigner: NostrSigner;
  constructor(privkey: string) {
    loadWasmSync();
    const keys = Keys.parse(privkey);
    this.nostrSigner = NostrSigner.keys(keys);
  }

  async getPublicKey(): Promise<string> {
    const pubkey = await this.nostrSigner.publicKey();
    return pubkey.toHex();
  }

  async signEvent(event: NostrEvent): Promise<Required<NostrEvent>> {
    const e = new EventBuilder(
      new Kind(event.kind),
      event.content,
      event.tags.map((tag) => Tag.parse(tag)),
    );
    const signedEvent = await this.nostrSigner.signEventBuilder(e);
    return JSON.parse(signedEvent.asJson());
  }
}
