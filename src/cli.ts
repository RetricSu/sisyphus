#!/usr/bin/env node
import { Command } from 'commander';
import { loadWasmSync } from '@rust-nostr/nostr-sdk';
import { createTables } from './memory/database';
import { Prompt } from './prompt';
import { chat } from './cmd/chat';
import { Config, ConfigItem } from './cmd/config';
import { buildIPCBot } from './cmd/ipc';
import { getDefaultIPCSocketPath } from './config/setting';
import { logger } from './logger';
import { createPrompt, downloadPrompt, listLocalAvailablePrompts } from './cmd/prompt';
import { input } from '@inquirer/prompts';
import { convertReadableTimeToMilSecs, runner } from './cmd/runner';
import { runServer } from './cmd/server';

loadWasmSync();
createTables();
Prompt.init();

const version = require('../package.json').version;
const description = require('../package.json').description;

const program = new Command();
program.name('sisyphus').description(description).version(version);

program
  .command('chat')
  .description('chat with AI Agent through the command line')
  .option('-c, --clean', 'clean chat without saving to memory')
  .option('--prompt <prompt>', 'Specific the prompt file name', undefined)
  .action(async (opt) => {
    const promptName = opt.prompt;
    const saveMemory = opt.clean != null ? !opt.clean : undefined;

    return await chat({ promptName, saveMemory });
  });

program
  .command('run')
  .description('run AI Agent at interval')
  .option('-c, --clean', 'clean chat without saving to memory')
  .option('--prompt <prompt>', 'Specific the prompt file name', undefined)
  .option('--hour <hour>', 'Specific the interval hour time', '0')
  .option('--minute <minute>', 'Specific the interval minute time', '0')
  .option('--second <hour>', 'Specific the interval second time', '0')
  .action(async (opt) => {
    const promptName = opt.prompt;
    const saveMemory = opt.clean != null ? !opt.clean : undefined;
    const intervalMilSecs = convertReadableTimeToMilSecs(+opt.hour, +opt.minute, +opt.second);
    return await runner({ promptName, saveMemory, intervalMilSecs });
  });

const ipcCommand = program
  .command('ipc')
  .description('make two AI Agents talk to each other in the same computer')
  .action(() => {
    console.log('IPC command called. Use "ipc send" or "ipc listen".');
  });

ipcCommand
  .command('listen') // first sub command
  .description('Start a IPC bot listening for message chatting')
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
  .description('Use a IPC bot to send a initial message to a target IPC bot')
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

const promptCommand = program
  .command('prompt')
  .description('Manger prompt files')
  .action(() => {
    console.log('prompt command called. Use "prompt get", "prompt create" or "prompt list".');
  });

promptCommand
  .command('download <name>')
  .description('Downloading Prompt Config File from Github')
  .action((name) => downloadPrompt(name));

promptCommand
  .command('create')
  .description('Create a prompt file in prompts folder.')
  .option('--folder <folder>', 'Specific the prompt folder path', undefined)
  .action(async (opt) => {
    const name = await input({ message: 'Enter a unique id for your Agent: ', required: true });
    await createPrompt(name, opt.folder);
  });

promptCommand
  .command('list')
  .description('List all local available Prompt Config Files')
  .action(() => listLocalAvailablePrompts());

program
  .command('config <action> [item] [value]')
  .description('do a configuration action')
  .action((action, item, value) => Config(action, item as ConfigItem, value));

program
  .command('server')
  .description('Run a http server to host Agent chatting history')
  .requiredOption('--memo-id <memoId>', 'Specific the memo-id of the Agent')
  .option('--port <port>', 'Specific the port number', undefined)
  .option('--limit <limit>', 'Specific the max limit number of chat history')
  .action((opt) => runServer(opt));

program.parse(process.argv);

// If no command is specified, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// deal with program panic
process.on('uncaughtException', (error) => {
  logger.error(`uncaughtException ${error?.message}`);
  process.exit(1);
});
