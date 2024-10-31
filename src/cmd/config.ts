import { configPath, readSettings, writeSettings } from '../config/setting';
import fs from 'fs';
import { Network } from '../offckb/offckb.config';

export enum ConfigAction {
  list = 'list',
  get = 'get',
  set = 'set',
  rm = 'rm',
}

export enum ConfigItem {
  prompt = 'prompt',
  ckbNetwork = 'ckb-network',
}

export async function Config(action: ConfigAction, item: ConfigItem, value?: string) {
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

      case ConfigItem.ckbNetwork: {
        const settings = readSettings();
        console.log(settings.ckbNetwork);
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

      case ConfigItem.ckbNetwork: {
        if (!value || !['devnet', 'testnet', 'mainnet'].includes(value)) {
          throw new Error(`not a valid network value ${value}`);
        }
        const settings = readSettings();
        settings.ckbNetwork = value as Network;
        writeSettings(settings);
        return;
      }

      default:
        break;
    }
  }

  if (action === ConfigAction.rm) {
    console.log('not impl');
    switch (item) {
      default:
        break;
    }
  }

  throw new Error('invalid config action.');
}
