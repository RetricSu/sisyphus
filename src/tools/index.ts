import { Tools } from "./type";
import fileTools from "./file";
import twitterTools from "./twitter";
import nosCKBTools from "./nosCKB";
import memoryTools from "./memory";
import terminalTools from "./terminal";
import readWebPageTools from "./readWebPage";
import timeTools from "./time";

const tools: Tools = [
  fileTools,
  twitterTools,
  nosCKBTools,
  memoryTools,
  terminalTools,
  readWebPageTools,
  timeTools,
];

export default tools;
