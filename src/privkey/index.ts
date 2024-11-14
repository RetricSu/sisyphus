import fs from 'fs';
import { getDefaultPrivkeyFilePath } from '../config/setting';
import path from 'path';
import crypto from 'crypto';

export const Privkey = {
  load,
  init,
  isPrivkeyInit,
  makeFolder,
};

export function load(memoId: string) {
  return fs.readFileSync(getDefaultPrivkeyFilePath(memoId), 'utf8').trim() as string;
}

export function isPrivkeyInit(memoId: string) {
  if (!fs.existsSync(getDefaultPrivkeyFilePath(memoId))) {
    return false;
  }
  return true;
}

export function init(memoId: string) {
  if (!isPrivkeyInit(memoId)) {
    makeFolder(memoId);
    fs.writeFileSync(getDefaultPrivkeyFilePath(memoId), crypto.randomBytes(32).toString('hex'));
  }
}

export function makeFolder(memoId: string) {
  const folder = path.dirname(getDefaultPrivkeyFilePath(memoId));
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}
