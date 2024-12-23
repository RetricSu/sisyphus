import * as fs from 'fs';
import * as path from 'path';
import { Tool, Tools } from './type';

const excludeFiles = ['index.ts', 'type.ts', 'util.ts'];

const tools: Tools = [];

const files = fs.readdirSync(__dirname).filter((file) => file.endsWith('.ts') && !excludeFiles.includes(file));

files.forEach(async (file) => {
  const modulePath = path.join(__dirname, file);
  const module = await import(modulePath);
  if (module.default) {
    const tool: Tool = {
      names: module.default().names,
      build: module.default().build,
    };
    tools.push(tool);
  }
});

export default tools;
