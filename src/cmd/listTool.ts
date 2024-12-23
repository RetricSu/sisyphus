import tools from '../tools';

export async function listTool() {
  const names = tools.flatMap((t) => t.names);
  console.log('tools = [');
  for (const name of names) {
    console.log(`'${name}',`);
  }
  console.log(']');
}
