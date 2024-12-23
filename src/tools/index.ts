import fileTools from './file';
import memoryTools from './memory';
import nosCKBTools from './nosCKB';
import readWebPageTools from './readWebPage';
import terminalTools from './terminal';
import timeTools from './time';
import twitterTools from './twitter';
import { Tools } from './type';

const tools: Tools = [fileTools, twitterTools, nosCKBTools, memoryTools, terminalTools, readWebPageTools, timeTools];

export default tools;
