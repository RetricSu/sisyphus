import { type Client, type NostrEvent, ccc } from "@ckb-ccc/core";
import { Nip07 } from "@ckb-ccc/nip07";
import {
  Filter,
  Keys,
  Metadata,
  Client as NostrClient,
  NostrSigner,
  Tag,
  loadWasmSync,
} from "@rust-nostr/nostr-sdk";
import type { Network } from "../offckb/offckb.config";
import { NostrProvider } from "./NostrProvider";
import { buildCccClient } from "./cccClient";
import type { HexNoPrefix, TransferOption } from "./type";

// Nostr and CKB
export class NosCKB {
  public network: Network;
  private relayList: string[];
  private nostrKeys: Keys;
  private nostrSigner: NostrSigner;
  private nostrClient: NostrClient;
  private cccClient: Client;
  private cccNostrSigner: Nip07.Signer;

  constructor({
    nostrPrivkey,
    network,
    relays = [],
  }: { nostrPrivkey: string; network: Network; relays?: string[] }) {
    this.network = network;
    this.cccClient = buildCccClient(network);

    loadWasmSync();
    const keys = Keys.parse(nostrPrivkey);
    this.nostrKeys = keys;
    this.nostrSigner = NostrSigner.keys(keys);
    this.relayList = relays;
    this.nostrClient = new NostrClient(this.nostrSigner);
    for (const relay of this.relayList) {
      this.nostrClient.addRelay(relay);
    }

    const provider = new NostrProvider(nostrPrivkey);
    this.cccNostrSigner = new Nip07.Signer(this.cccClient, provider);
  }

  async publishNote(text: string) {
    await this.nostrClient.connect();
    const res = await this.nostrClient.publishTextNote(text, []);
    await this.nostrClient.disconnect();
    return { eventId: res.id.toBech32() };
  }

  async readNostrEvents(filters: Filter[]) {
    await this.nostrClient.connect();
    const events = await this.nostrClient.getEventsFrom(
      this.relayList,
      filters,
    );
    await this.nostrClient.disconnect();
    return events.map((e) => JSON.parse(e.asJson()) as Required<NostrEvent>);
  }

  async readMentionNotesWithMe() {
    const filter = Filter.fromJson(
      JSON.stringify({
        kinds: [1],
        "#p": [(await this.cccNostrSigner.getNostrPublicKey()).slice(2)],
      }),
    );
    await this.nostrClient.connect();
    const events = await this.nostrClient.getEventsFrom(this.relayList, [
      filter,
    ]);
    await this.nostrClient.disconnect();
    return events.map((e) => JSON.parse(e.asJson()) as Required<NostrEvent>);
  }

  async publishReplyNotesToEvent(text: string, eventId: HexNoPrefix) {
    await this.nostrClient.connect();
    const tag = Tag.parse(["e", eventId]);
    const res = await this.nostrClient.publishTextNote(text, [tag]);
    await this.nostrClient.disconnect();
    return { eventId: res.id.toBech32() };
  }

  async publishProfileEvent(
    name: string,
    about: string,
    avatarPictureUrl = "https://image.nostr.build/13ee4c26a7b40da80fd7078cd12621ca072ce09cbd5f1ac081e3300c1639bbfb.jpg",
  ) {
    await this.nostrClient.connect();
    const metadata = new Metadata()
      .name(name)
      .about(about)
      .picture(avatarPictureUrl);
    const res = await this.nostrClient.setMetadata(metadata);
    await this.nostrClient.disconnect();
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

  async getMyXUdtArgs() {
    const lockScript = (await this.cccNostrSigner.getRecommendedAddressObj())
      .script;
    const xudtArgs = lockScript.hash() + "00000000";
    return xudtArgs;
  }

  async issueTokenToReceiver({
    udtAmount,
    receiptAddress,
    feeRate = 1000,
  }: {
    udtAmount: string;
    receiptAddress: string;
    feeRate?: number;
  }) {
    const xudtArgs = await this.getMyXUdtArgs();

    const typeScript = await ccc.Script.fromKnownScript(
      this.cccNostrSigner.client,
      ccc.KnownScript.XUdt,
      xudtArgs,
    );
    const receiver = await ccc.Address.fromString(
      receiptAddress,
      this.cccClient,
    );

    const tx = ccc.Transaction.from({
      outputs: [
        {
          lock: receiver.script,
          type: typeScript,
        },
      ],
      outputsData: [ccc.numLeToBytes(udtAmount, 16)],
    });
    await tx.addCellDepsOfKnownScripts(this.cccClient, ccc.KnownScript.XUdt);
    await tx.completeInputsByCapacity(this.cccNostrSigner);
    await tx.completeFeeBy(this.cccNostrSigner, feeRate);
    const txHash = await this.cccNostrSigner.sendTransaction(tx);
    return txHash;
  }

  async issueTokenToMyself({
    udtAmount,
    feeRate = 1000,
  }: { udtAmount: string; feeRate?: number }) {
    return await this.issueTokenToReceiver({
      udtAmount,
      receiptAddress: (
        await this.cccNostrSigner.getRecommendedAddressObj()
      ).toString(),
      feeRate,
    });
  }

  async getMyUdtBalance() {
    const xudtArgs = await this.getMyXUdtArgs();
    const typeScript = await ccc.Script.fromKnownScript(
      this.cccClient,
      ccc.KnownScript.XUdt,
      xudtArgs,
    );

    let udtBalance: ccc.Num = BigInt(0);
    const collector = this.cccClient.findCellsByType(typeScript, true);
    for await (const cell of collector) {
      if (
        cell.cellOutput.lock.hash() ===
        (await this.cccNostrSigner.getRecommendedAddressObj()).script.hash()
      ) {
        udtBalance += ccc.udtBalanceFrom(cell.outputData);
      }
    }
    return udtBalance.toString(10);
  }

  async transferToken({
    toAddress,
    udtAmount,
    feeRate = 1000,
  }: {
    toAddress: string;
    udtAmount: string;
    feeRate?: number;
  }) {
    const receiverLockScript = (
      await ccc.Address.fromString(toAddress, this.cccClient)
    ).script;

    const xudtArgs = await this.getMyXUdtArgs();
    const xUdtType = await ccc.Script.fromKnownScript(
      this.cccClient,
      ccc.KnownScript.XUdt,
      xudtArgs,
    );

    const tx = ccc.Transaction.from({
      outputs: [{ lock: receiverLockScript, type: xUdtType }],
      outputsData: [ccc.numLeToBytes(udtAmount, 16)],
    });
    await tx.addCellDepsOfKnownScripts(this.cccClient, ccc.KnownScript.XUdt);
    await tx.completeInputsByUdt(this.cccNostrSigner, xUdtType);
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
