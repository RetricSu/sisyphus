import { ChromaClient } from 'chromadb';
import { readSettings } from '../config/setting';
import type { DBMessage } from './db-message';

const settings = readSettings();

export class EmbeddingMessageManager {
  private client: ChromaClient;
  public collectionName: string;

  constructor(collectionName: string) {
    this.client = new ChromaClient({ path: settings.memory.apiUrl });
    this.collectionName = collectionName;
  }

  public async save(aMsg: DBMessage) {
    if (aMsg.dbId == null) {
      throw new Error('please save in the db first before saving in chroma memory');
    }
    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    const metadata: EmbeddingMessageMetadata = {
      role: aMsg.msg.role,
      created_at: Date.now(),
    };

    await collection.upsert({
      documents: [aMsg.msg.content],
      metadatas: [metadata as any],
      ids: [aMsg.dbId.toString()],
    });
  }

  public async query({ searchString, limit }: { searchString: string; limit?: number }) {
    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });
    const results = await collection.query({
      queryTexts: searchString,
      nResults: limit,
    });
    return results;
  }
}

export interface EmbeddingMessageMetadata {
  role: string;
  created_at: number; // milsecs timestamp
}
