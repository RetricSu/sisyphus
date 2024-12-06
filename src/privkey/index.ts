import fs from 'fs';
import { getDefaultPrivkeyFilePath } from '../config/setting';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../logger';

export const Privkey = {
  load,
  init,
  isPrivkeyInit: isPrivkeyInitialized,
  makeFolder,
};

export function load(memoId: string) {
  return fs.readFileSync(getDefaultPrivkeyFilePath(memoId), 'utf8').trim() as string;
}

export function isPrivkeyInitialized(memoId: string) {
  if (fs.existsSync(getDefaultPrivkeyFilePath(memoId))) {
    return true;
  }
  return false;
}

export function init(memoId: string) {
  if (!isPrivkeyInitialized(memoId)) {
    makeFolder(memoId);
    fs.writeFileSync(getDefaultPrivkeyFilePath(memoId), crypto.randomBytes(32).toString('hex'));
    logger.debug(`Init a New Privkey for Agent ${memoId}`);
  }
}

export function makeFolder(memoId: string) {
  const folder = path.dirname(getDefaultPrivkeyFilePath(memoId));
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}
