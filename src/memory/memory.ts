import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { readSettings } from '../config/setting';

export class Memory {
  id: string;
  text: string;
  constructor(text: string, id?: string) {
    this.id = id || uuidv4();
    this.text = text;
  }
}

export class MemoryManager {
  private memoryFilePath: string;
  private memories: Memory[] = [];
  constructor(memoId: string) {
    this.memoryFilePath = path.join(readSettings().memory.memoryFolderPath, `${memoId}.txt`);
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.memoryFilePath)) {
        const data = fs.readFileSync(this.memoryFilePath, 'utf-8');
        this.memories = data
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => {
            const [id, ...textParts] = line.split('|||');
            return new Memory(textParts.join('|||'), id);
          });
      }
    } catch (error) {
      console.error('Error loading memory:', error);
    }
  }

  async create(text: string): Promise<Memory> {
    const newMemory = new Memory(text);
    this.memories.push(newMemory);
    await this.save();
    return newMemory;
  }

  read(): Memory[] {
    return this.memories;
  }

  async update(id: string, text: string): Promise<void> {
    const memory = this.memories.find((mem) => mem.id === id);
    if (memory) {
      memory.text = text;
      await this.save();
    } else {
      throw new Error(`Memory with id ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    this.memories = this.memories.filter((mem) => mem.id !== id);
    await this.save();
  }

  private async save(): Promise<void> {
    const lines = this.memories.map((mem) => `${mem.id}|||${mem.text}`).join('\n');
    fs.writeFileSync(this.memoryFilePath, lines);
  }
}
