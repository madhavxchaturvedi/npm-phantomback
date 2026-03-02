import chalk from 'chalk';

const PREFIX = chalk.hex('#a78bfa').bold('[PhantomBack]');

export const logger = {
  info: (...args) => console.log(PREFIX, chalk.cyan('INFO'), ...args),
  success: (...args) => console.log(PREFIX, chalk.green('✓'), ...args),
  warn: (...args) => console.log(PREFIX, chalk.yellow('⚠'), ...args),
  error: (...args) => console.error(PREFIX, chalk.red('✗'), ...args),
  route: (method, path) => {
    const colors = {
      GET: chalk.green,
      POST: chalk.blue,
      PUT: chalk.yellow,
      PATCH: chalk.magenta,
      DELETE: chalk.red,
    };
    const colorFn = colors[method] || chalk.white;
    console.log(PREFIX, colorFn.bold(method.padEnd(7)), chalk.dim(path));
  },
  server: (port) => {
    console.log('');
    console.log(PREFIX, chalk.green.bold('Server is running!'));
    console.log(PREFIX, chalk.dim('Local:'), chalk.cyan.underline(`http://localhost:${port}`));
    console.log('');
  },
  banner: () => {
    console.log('');
    console.log(chalk.hex('#a78bfa').bold('  ╔═══════════════════════════════════════╗'));
    console.log(
      chalk.hex('#a78bfa').bold('  ║         ') +
        chalk.white.bold('PhantomBack v1.0.0') +
        chalk.hex('#a78bfa').bold('         ║'),
    );
    console.log(
      chalk.hex('#a78bfa').bold('  ║   ') +
        chalk.dim('Instant Fake Backend Generator') +
        chalk.hex('#a78bfa').bold('    ║'),
    );
    console.log(chalk.hex('#a78bfa').bold('  ╚═══════════════════════════════════════╝'));
    console.log('');
  },
  table: (resources) => {
    console.log(PREFIX, chalk.white.bold('Registered Resources:'));
    for (const [name, config] of Object.entries(resources)) {
      const count = config.seed || 0;
      const auth = config.auth ? chalk.yellow(' 🔒') : '';
      console.log(
        PREFIX,
        chalk.dim('  ├─'),
        chalk.white.bold(name),
        chalk.dim(`(${count} records)`),
        auth,
      );
    }
    console.log('');
  },

  // ── Reality Mode (Chaos) Logging ──
  chaos: (...args) =>
    console.log(PREFIX, chalk.hex('#ff6b6b').bold('⚡CHAOS'), ...args),

  chaosBanner: (config) => {
    console.log('');
    console.log(chalk.hex('#ff6b6b').bold('  ┌───────────────────────────────────────┐'));
    console.log(
      chalk.hex('#ff6b6b').bold('  │    ') +
        chalk.white.bold('⚡ Reality Mode ACTIVE ⚡') +
        chalk.hex('#ff6b6b').bold('        │'),
    );
    console.log(
      chalk.hex('#ff6b6b').bold('  │  ') +
        chalk.dim('Chaos is being injected into your API') +
        chalk.hex('#ff6b6b').bold(' │'),
    );
    console.log(chalk.hex('#ff6b6b').bold('  └───────────────────────────────────────┘'));
    console.log('');
    if (config) {
      const scenarios = config.scenarios || [];
      console.log(PREFIX, chalk.hex('#ff6b6b').bold('Active Scenarios:'));
      if (scenarios.includes('latency')) {
        console.log(
          PREFIX,
          chalk.dim('  ├─'),
          chalk.yellow('⏱  Latency Spikes'),
          chalk.dim(`(${config.latency?.min || 200}–${config.latency?.max || 5000}ms)`),
        );
      }
      if (scenarios.includes('failure')) {
        console.log(
          PREFIX,
          chalk.dim('  ├─'),
          chalk.red('💥 Random Failures'),
          chalk.dim(`(${(config.failureRate || 0.1) * 100}% rate)`),
        );
      }
      if (scenarios.includes('drop')) {
        console.log(
          PREFIX,
          chalk.dim('  ├─'),
          chalk.magenta('🔌 Connection Drops'),
          chalk.dim(`(${(config.connectionDropRate || 0.02) * 100}% rate)`),
        );
      }
      if (scenarios.includes('corruption')) {
        console.log(
          PREFIX,
          chalk.dim('  ├─'),
          chalk.hex('#ff9f43')('🧩 Response Corruption'),
          chalk.dim(`(${(config.corruptionRate || 0.02) * 100}% rate)`),
        );
      }
      if (scenarios.includes('timeout')) {
        console.log(
          PREFIX,
          chalk.dim('  ├─'),
          chalk.hex('#ee5a24')('⏳ Request Timeouts'),
          chalk.dim(`(${(config.timeoutRate || 0.03) * 100}% rate)`),
        );
      }
      console.log('');
    }
  },
};
