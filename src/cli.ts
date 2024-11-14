#!/usr/bin/env node
import { Command } from 'commander';
import { loadWasmSync } from '@rust-nostr/nostr-sdk';
import { createTables } from './memory/database';
import { Privkey } from './privkey';
import { Prompt } from './prompt';
import { chat } from './cmd/chat';
import { Config, ConfigItem } from './cmd/config';
import { buildIPCBot } from './cmd/ipc';
import { getDefaultIPCSocketPath } from './config/setting';

loadWasmSync();
createTables();
Prompt.init();
Privkey.init();

const version = require('../package.json').version;
const description = require('../package.json').description;

const program = new Command();
program.name('sisyphus').description(description).version(version);

program
  .command('task')
  .description('Wake up Sisyphus to do a routine task')
  .action(async () => {
    // todo
    throw new Error('not implemented!');
  });

const ipcCommand = program
  .command('ipc')
  .description('Wake up Sisyphus to do a routine task')
  .action(() => {
    console.log('IPC command called. Use "ipc send" or "ipc listen".');
  });

ipcCommand
  .command('listen') // first sub command
  .description('Start a IPC bot')
  .requiredOption('--prompt <prompt>', 'Specific the prompt file name')
  .option('--socket-path <socketPath>', 'Specific the socket path for the ICP bot')
  .action(async (opt) => {
    const promptName = opt.prompt;
    const socketPath = opt.socketPath;
    const bot = await buildIPCBot({ promptName, socketPath });
    bot.listen();
  });

ipcCommand
  .command('send <message>') // second sub command
  .description('Send a IPC bot')
  .requiredOption('--prompt <prompt>', 'Specific the prompt file name')
  .option('--socket-path <socketPath>', 'Specific the socket path of the target ICP bot to connect')
  .option('--memo-id <memoId>', 'Specific the memoId of the target ICP bot to connect')
  .action(async (message, opt) => {
    const promptName = opt.prompt;
    const memoId = opt.memoId;
    const socketPath = opt.socketPath || getDefaultIPCSocketPath(memoId);
    if (socketPath == null) {
      throw new Error('Please provide a socketPath or memoId of the target IPC bot to connect');
    }
    const bot = await buildIPCBot({ promptName, saveMemory: false });
    bot.sendClientRequest(socketPath, message);
  });

program
  .command('chat')
  .description('Chat with user through the command line')
  .option('-c, --clean', 'clean chat without saving to memory')
  .option('--prompt <prompt>', 'Specific the prompt file name', undefined)
  .action(async (opt) => {
    const promptName = opt.prompt;
    const saveMemory = opt.clean != null ? !opt.clean : undefined;

    return await chat({ promptName, saveMemory });
  });

program
  .command('config <action> [item] [value]')
  .description('do a configuration action')
  .action((action, item, value) => Config(action, item as ConfigItem, value));

program.parse(process.argv);

// If no command is specified, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
