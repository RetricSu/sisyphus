import fileTools from './file';
import memoryTools from './memory';
import memoryManagerTools from './memoryManager'; // Import the new memoryManager tool
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
  memoryTools,
  terminalTools,
  readWebPageTools,
  timeTools,
  memoryManagerTools,
]; // Add the new memoryManager tool to the array

export default tools;
