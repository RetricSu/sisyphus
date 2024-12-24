import chatMsgTool from './chatMsg';
import fileTools from './file';
import memoryManagerTools from './memoryManager';
import nosCKBTools from './nosCKB';
import readWebPageTools from './readWebPage';
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
