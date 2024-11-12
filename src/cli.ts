#!/usr/bin/env node
import { Command } from 'commander';
import { loadWasmSync } from '@rust-nostr/nostr-sdk';
import { createTables } from './memory/database';
import { Privkey } from './privkey';
import { Prompt } from './prompt';
import { chat } from './cmd/chat';
import { Config, ConfigItem } from './cmd/config';

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
