import * as path from "path";
import * as fs from "fs";
interface Tool {
  name: string;
  build: (params: any) => any;
}
const tools: Tool[] = [];
const files = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts");
files.forEach(async (file) => {
  const modulePath = path.join(__dirname, file);
  const module = await import(modulePath);
  if (module.default) {
    tools.push(module.default());
  }
});
export default tools;
