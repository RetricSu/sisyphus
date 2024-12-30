import chatMsgTool from './chat-msg';
import fileTools from './file';
import readWebPageTools from './internet-access';
import memoryManagerTools from './memory-manager';
import nosCKBTools from './nostr-ckb';
import terminalTools from './terminal';
import timeTools from './time';
import twitterTools from './twitter';

import { Tools } from './type';

const tools: Tools = [
  fileTools,
  twitterTools,
  nosCKBTools,
  chatMsgTool,
  terminalTools,
  readWebPageTools,
  timeTools,
  memoryManagerTools,
];

export default tools;
