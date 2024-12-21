import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';
import envPaths from './env-path';

const paths = envPaths('sisyphus');

export const configPath = path.join(paths.config, 'settings.json');
export const dataPath = paths.data;
export const cachePath = paths.cache;

export const packageSrcPath = path.dirname(require.main!.filename);
export const packageRootPath = path.resolve(packageSrcPath, '../');

export const defaultPromptName = 'base';

export interface ProxyBasicCredentials {
  username: string;
  password: string;
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: ProxyBasicCredentials;
  protocol?: string;
}

export interface Settings {
  proxy?: ProxyConfig;
  database: {
    filePath: string;
  };
  IPCSocketPathRootFolder: string;
  privkey: {
    rootFolder: string;
  };
  twitter: {
    rootFolder: string;
  };
  prompt: {
    rootFolder: string;
    selectedPromptName: string;
  };
  memory: {
    apiUrl: string;
    database: {
      folderPath: string;
    };
  };
}

export const defaultSettings: Settings = {
  proxy: undefined,
  database: {
    filePath: path.resolve(dataPath, 'database/chat-message.db'),
  },
  IPCSocketPathRootFolder: path.resolve(dataPath, 'ipc/'),
  privkey: {
    rootFolder: path.resolve(dataPath, 'privkey/'),
  },
  twitter: {
    rootFolder: path.resolve(dataPath, 'twitter/'),
  },
  prompt: {
    rootFolder: path.resolve(dataPath, 'prompt'),
    selectedPromptName: defaultPromptName,
  },
  memory: {
    apiUrl: 'http://127.0.0.1:8000',
    database: {
      folderPath: path.resolve(dataPath, 'memory/chroma'),
    },
  },
};

export function readSettings(): Settings {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return deepMerge(defaultSettings, JSON.parse(data)) as Settings;
    } else {
      return defaultSettings;
    }
  } catch (error) {
    logger.error('Error reading settings:', error);
    return defaultSettings;
  }
}

export function writeSettings(settings: Settings): void {
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
    console.log('save new settings');
  } catch (error) {
    logger.error('Error writing settings:', error);
  }
}

export function getPromptFilePath(selectedPromptName: string) {
  const settings = readSettings();
  const tomlFile = path.resolve(settings.prompt.rootFolder, `${selectedPromptName}.toml`);
  return tomlFile;
}

export function getDefaultIPCSocketPath(memoId: string) {
  const settings = readSettings();
  const tomlFile = path.resolve(settings.IPCSocketPathRootFolder, `${memoId}.socket`);
  return tomlFile;
}

export function getDefaultPrivkeyFilePath(memoId: string) {
  const settings = readSettings();
  return path.resolve(settings.privkey.rootFolder, `.${memoId}`);
}

export function getDefaultTwitterFilePath(username: string) {
  const settings = readSettings();
  return path.resolve(settings.twitter.rootFolder, `.${username}`);
}

function deepMerge(target: any, source: any): any {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
