import { configPath, readSettings, writeSettings } from '../config/setting';
import { Request } from '../util/request';

export enum ConfigAction {
  list = 'list',
  get = 'get',
  set = 'set',
  rm = 'rm',
}

export enum ConfigItem {
  proxy = 'proxy',
  ckbNetwork = 'ckb-network',
  memoryFilePath = 'memoryFilePath',
}

export async function Config(action: ConfigAction, item: ConfigItem, value?: string) {
  if (action === ConfigAction.list) {
    console.log('config file: ', configPath);
    return console.log(readSettings());
  }

  if (action === ConfigAction.get) {
    switch (item) {
      case ConfigItem.proxy: {
        const settings = readSettings();
        const proxy = settings.proxy;
        if (proxy == null) {
          console.log(`No Proxy.`);
          process.exit(0);
        }
        return console.log(`${Request.proxyConfigToUrl(proxy)}`);
      }

      case ConfigItem.memoryFilePath:
        {
          const settings = readSettings();
          const memoryFilePath = settings.memory.memoryFilePath;
          if (memoryFilePath == null) {
            console.log(`No memoryFilePath.`);
            process.exit(0);
          }
          return console.log(`${memoryFilePath}`);
        }
        break;

      default:
        break;
    }
  }

  if (action === ConfigAction.set) {
    switch (item) {
      case ConfigItem.proxy: {
        if (value == null) throw new Error('No proxyUrl!');

        try {
          const proxy = Request.parseProxyUrl(value);
          const settings = readSettings();
          settings.proxy = proxy;
          return writeSettings(settings);
        } catch (error: unknown) {
          return console.error(`invalid proxyURL, `, (error as Error).message);
        }
      }
      case ConfigItem.memoryFilePath: {
        if (value == null) throw new Error('No memoryFilePath!');
        const settings = readSettings();
        settings.memory.memoryFilePath = value;
        return writeSettings(settings);
      }

      default:
        break;
    }
  }

  if (action === ConfigAction.rm) {
    switch (item) {
      case ConfigItem.proxy: {
        const settings = readSettings();
        settings.proxy = undefined;
        return writeSettings(settings);
      }

      default:
        break;
    }
  }

  throw new Error('invalid config action.');
}
