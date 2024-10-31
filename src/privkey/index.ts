import fs from 'fs';
import { readSettings } from '../config/setting';
import path from 'path';
import crypto from 'crypto';

const settings = readSettings();

export const Privkey = {
  load,
  init,
  isPrivkeyInit,
  makeFolder,
};

export function load() {
  return fs.readFileSync(settings.privkey.filePath, 'utf8').trim() as string;
}

export function isPrivkeyInit() {
  if (!fs.existsSync(settings.privkey.filePath)) {
    return false;
  }
  return true;
}

export function init() {
  if (!isPrivkeyInit()) {
    makeFolder();
    fs.writeFileSync(settings.privkey.filePath, crypto.randomBytes(32).toString('hex'));
  }
}

export function makeFolder() {
  const folder = path.dirname(settings.privkey.filePath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}
