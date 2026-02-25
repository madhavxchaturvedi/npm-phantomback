#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('phantomback')
  .description('👻 Instant fake backend generator with smart responses')
  .version(pkg.version);

program
  .command('start')
  .description('Start the PhantomBack fake API server')
  .option('-p, --port <port>', 'Server port', '3777')
  .option('--prefix <prefix>', 'API route prefix', '/api')
  .option('-c, --config <path>', 'Path to config file')
  .option('-z, --zero', 'Zero-config mode: generate a full demo backend')
  .action(async (options) => {
    const { startCommand } = await import('../src/cli/commands.js');
    await startCommand(options);
  });

program
  .command('init')
  .description('Generate a starter phantom.config.js file')
  .action(async () => {
    const { initCommand } = await import('../src/cli/commands.js');
    await initCommand();
  });

program.parse();
