#!/usr/bin/env node
import { Command } from 'commander';
import { Vat } from './vat';

const version = require('../package.json').version;
const description = require('../package.json').description;

const program = new Command();
program.name('sisyphus').description(description).version(version);

program
  .command('run')
  .description('Wake up Sisyphus to start the digital life')
  .action(async () => {
    console.log('not implemented yet!');
  });

program
  .command('chat')
  .description('Chat with user through the command line')
  .action(async () => {
    const vat = new Vat();
    vat.start();
  });

program.parse(process.argv);

// If no command is specified, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
