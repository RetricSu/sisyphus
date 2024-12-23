import fileTools from './file';
import memoryManagerTools from './memoryManager'; // Import the new memoryManager tool
import nosCKBTools from './nosCKB';
import readWebPageTools from './readWebPage';
import memoryTools from './searchChatMsg';
import terminalTools from './terminal';
import timeTools from './time';
import twitterTools from './twitter';
import { Tools } from './type';
const tools: Tools = [
  fileTools,
  twitterTools,
  nosCKBTools,
  memoryTools,
  terminalTools,
  readWebPageTools,
  timeTools,
  memoryManagerTools,
]; // Add the new memoryManager tool to the array

export default tools;
