import { configPath, readSettings } from '../config/setting';
import fs from 'fs';

export enum ConfigAction {
  list = 'list',
  get = 'get',
  set = 'set',
  rm = 'rm',
}

export enum ConfigItem {
  prompt = 'prompt',
}

export async function Config(action: ConfigAction, item: ConfigItem, _value?: string) {
  if (action === ConfigAction.list) {
    console.log('config file: ', configPath);
    return console.log(readSettings());
  }

  if (action === ConfigAction.get) {
    switch (item) {
      case ConfigItem.prompt: {
        const settings = readSettings();
        const files = fs.readdirSync(settings.prompt.rootFolder);
        console.log('Available Prompts: ');
        files.forEach((f) => {
          console.log('  - ', f);
        });
        console.log('');
        console.log('store at', settings.prompt.rootFolder);
        return;
      }

      default:
        break;
    }
  }

  if (action === ConfigAction.set) {
    switch (item) {
      case ConfigItem.prompt: {
        return console.log('not impl');
      }

      default:
        break;
    }
  }

  if (action === ConfigAction.rm) {
    switch (item) {
      default:
        break;
    }
  }

  throw new Error('invalid config action.');
}
