import fs from 'fs';
import toml from '@iarna/toml';
import { getPromptFilePath } from '../config/setting';
import type { PromptFile } from './type';

export class Reader {
  static parseFrom(selectedPromptName: string) {
    const filePath = getPromptFilePath(selectedPromptName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`${filePath} not exits`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const prompt = toml.parse(content) as unknown as PromptFile;

    return prompt;
  }
}
