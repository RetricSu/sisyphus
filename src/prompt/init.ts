import fs from 'fs';
import path from 'path';
import { defaultPromptName, getPromptFilePath, packageSrcPath, readSettings } from '../config/setting';

export function init() {
  const settings = readSettings();
  if (!fs.existsSync(settings.prompt.rootFolder)) {
    fs.mkdirSync(settings.prompt.rootFolder, { recursive: true });
  }

  if (!fs.existsSync(getPromptFilePath(defaultPromptName))) {
    const sourceFilePath = path.resolve(packageSrcPath, `./prompt/${defaultPromptName}.toml`);
    const destinationFilePath = getPromptFilePath(defaultPromptName);
    fs.copyFileSync(sourceFilePath, destinationFilePath);
  }
}
