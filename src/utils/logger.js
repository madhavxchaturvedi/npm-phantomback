import chalk from 'chalk';

// ─── Brand Palette ────────────────────────────────────────────────────────────
const c = {
  violet:  (s) => chalk.hex('#a78bfa')(s),
  violetB: (s) => chalk.hex('#a78bfa').bold(s),
  pink:    (s) => chalk.hex('#f472b6')(s),
  red:     (s) => chalk.hex('#f87171')(s),
  redB:    (s) => chalk.hex('#f87171').bold(s),
  orange:  (s) => chalk.hex('#fb923c')(s),
  yellow:  (s) => chalk.hex('#fbbf24')(s),
  green:   (s) => chalk.hex('#4ade80')(s),
  greenB:  (s) => chalk.hex('#4ade80').bold(s),
  cyan:    (s) => chalk.hex('#22d3ee')(s),
  cyanB:   (s) => chalk.hex('#22d3ee').bold(s),
  white:   (s) => chalk.white(s),
  whiteB:  (s) => chalk.white.bold(s),
  dim:     (s) => chalk.dim(s),
};

// ─── Strip ANSI escape codes to get real visible length ──────────────────────
// eslint-disable-next-line no-control-regex
const stripAnsi = (s) => String(s).replace(/\x1B\[[0-9;]*m/g, '');
const visLen    = (s) => stripAnsi(s).length;

// ─── HTTP Method badge styles ─────────────────────────────────────────────────
const METHOD_BADGE = {
  GET:    chalk.bgHex('#052e16').hex('#4ade80').bold,
  POST:   chalk.bgHex('#172554').hex('#60a5fa').bold,
  PUT:    chalk.bgHex('#422006').hex('#fbbf24').bold,
  PATCH:  chalk.bgHex('#2d1b69').hex('#f472b6').bold,
  DELETE: chalk.bgHex('#450a0a').hex('#f87171').bold,
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(label) {
  const isTTY = process.stdout.isTTY;
  let i = 0;
  let timer;
  const spin = () => {
    process.stdout.write(`\r  ${c.violet(SPINNER_FRAMES[i++ % SPINNER_FRAMES.length])}  ${c.dim(label)}  `);
  };
  return {
    start() {
      if (isTTY) { spin(); timer = setInterval(spin, 80); }
    },
    stop(doneLabel) {
      if (isTTY) {
        clearInterval(timer);
        process.stdout.write(`\r\x1B[2K  ${c.green('✓')}  ${c.whiteB(doneLabel || label)}\n`);
      } else {
        console.log(`  ${c.green('✓')}  ${c.whiteB(doneLabel || label)}`);
      }
    },
    fail(errLabel) {
      if (isTTY) {
        clearInterval(timer);
        process.stdout.write(`\r\x1B[2K  ${c.red('✗')}  ${c.red(errLabel || label)}\n`);
      } else {
        console.log(`  ${c.red('✗')}  ${c.red(errLabel || label)}`);
      }
    },
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Box drawing helpers ──────────────────────────────────────────────────────
// W = inner width (visible chars). All box rows must fit exactly W visible chars.
function boxTop(W, colorFn)    { return `  ${colorFn('╭' + '─'.repeat(W) + '╮')}`; }
function boxBottom(W, colorFn) { return `  ${colorFn('╰' + '─'.repeat(W) + '╯')}`; }
function boxEmpty(W, colorFn)  { return `  ${colorFn('│')}${' '.repeat(W)}${colorFn('│')}`; }

/**
 * Render a box row: left border + content padded to exactly W visible chars + right border.
 * `content` may contain ANSI codes — we measure visible length and pad with spaces.
 */
function boxRow(W, colorFn, content, indent = '   ') {
  const visible = visLen(indent) + visLen(content);
  const pad = Math.max(0, W - visible);
  return `  ${colorFn('│')}${indent}${content}${' '.repeat(pad)}${colorFn('│')}`;
}

// ─── Ghost lines — each exactly 15 visible chars wide ────────────────────────
const GHOST_LINES = [
  () => c.violet('   ████████    '),   // 15
  () => c.violet('  ██') + chalk.dim('░░░░') + c.violet('██     '),  // 15
  () => c.violet('  ██') + chalk.white(' ◉  ◉ ') + c.violet('██   '),  // 15
  () => c.violet('  ██') + chalk.white('  ▾   ') + c.violet('██   '),  // 15
  () => c.violet('  ████████████ '),   // 15
  () => c.violet('  ██') + c.dim('▀') + c.violet('██') + c.dim('▀') + c.violet('██') + c.dim('▀') + c.violet('██  '), // 15
];

export const logger = {

  info:    (...a) => console.log(`  ${c.dim('·')} ${c.cyan(a.join(' '))}`),
  success: (...a) => console.log(`  ${c.green('✓')} ${c.whiteB(a.join(' '))}`),
  warn:    (...a) => console.log(`  ${c.yellow('⚠')} ${c.yellow(a.join(' '))}`),
  error:   (...a) => console.error(`  ${c.red('✗')} ${c.red(a.join(' '))}`),

  route: (method, path) => {
    const badge = (METHOD_BADGE[method] || chalk.bgGray.white.bold)(` ${method.padEnd(6)}`);
    console.log(`  ${badge}  ${c.dim(path)}`);
  },

  // ── Startup banner ──────────────────────────────────────────────────────────
  banner: () => {
    // Inner width = 54 visible chars
    const W  = 54;
    const bv = c.violetB;

    // Ghost is 15 visible chars wide, gap = 3, text column = 32 visible chars
    // Total inner content per row = 3 (indent) + 15 (ghost) + 3 (gap) + text
    // We use boxRow which handles padding automatically

    const rows = [
      // [ghostLine(), textContent]  — ghost=15 vis, gap=3, text varies
      [GHOST_LINES[0](), c.violetB('PhantomBack')],
      [GHOST_LINES[1](), c.dim('Instant Fake Backend')],
      [GHOST_LINES[2](), c.dim('Reality Mode · Chaos Engineering')],
      [GHOST_LINES[3](), c.dim('v2.0.4')],
      [GHOST_LINES[4](), ''],
      [GHOST_LINES[5](), ''],
    ];

    console.log('');
    console.log(boxTop(W, bv));
    console.log(boxEmpty(W, bv));

    for (const [ghost, text] of rows) {
      // visible: indent(3) + ghost(15) + gap(3) + text(varies)
      const inner = ghost + '   ' + text;
      console.log(boxRow(W, bv, inner));
    }

    console.log(boxEmpty(W, bv));
    console.log(boxBottom(W, bv));
    console.log('');
  },

  // ── Resource table ───────────────────────────────────────────────────────────
  table: (resources, store, prefix = '/api', hasAuth = false) => {
    const entries = Object.entries(resources);
    if (entries.length === 0) return;

    // Method pills — very short colored tags
    const M = {
      GET:    chalk.hex('#4ade80')('GET'),
      POST:   chalk.hex('#60a5fa')('POST'),
      PUT:    chalk.hex('#fbbf24')('PUT'),
      PATCH:  chalk.hex('#f472b6')('PATCH'),
      DELETE: chalk.hex('#f87171')('DEL'),
    };
    const CRUD = `${M.GET} ${M.POST} ${M.PUT} ${M.PATCH} ${M.DELETE}`;

    console.log(`  ${c.dim('┌─ ROUTES' + '─'.repeat(46))}`);
    console.log('');

    let total = 0;
    entries.forEach(([name, cfg], i) => {
      const isLast = i === entries.length - 1 && !hasAuth;
      const tree   = isLast ? '└─' : '├─';
      const count  = store ? store.count(name) : (cfg.seed || 0);
      total += count;
      const authBadge = cfg.auth ? c.yellow('⚑') : c.dim('·');
      const path      = c.dim(`${prefix}/`) + c.violetB(name.padEnd(14));
      console.log(`  ${c.dim(tree)} ${authBadge} ${path}  ${c.dim('·')}  ${CRUD}  ${c.dim(`(${count})`)}`);
    });

    if (hasAuth) {
      const authMethods = `${M.GET} ${M.POST}`;
      console.log(`  ${c.dim('└─')} ${c.yellow('⚑')} ${c.dim(`${prefix}/`)}${c.yellow('auth'.padEnd(14))}  ${c.dim('·')}  ${authMethods}  ${c.dim('(login · register · me)')}`);
    }

    console.log('');
    const routeCount = entries.length * 6 + (hasAuth ? 3 : 0);
    const totalStr   = store ? String(total) : '–';
    console.log(`  ${c.dim('·')} ${c.green(totalStr)} ${c.dim('records')}  ${c.dim('·')}  ${c.white(String(routeCount))} ${c.dim('routes')}  ${c.dim('·')}  ${c.dim(`GET ${prefix} for full endpoint list`)}`);
    console.log('');
  },

  // ── Server ready ─────────────────────────────────────────────────────────────
  server: (port) => {
    console.log('');
    console.log(`  ${c.greenB('◆ Ready')}  ${c.dim('—')}  ${c.dim('server is live')}`);
    console.log('');
    console.log(`  ${c.dim('Local')}    ${c.cyanB('http://localhost:' + port)}`);
    console.log(`  ${c.dim('API')}      ${c.cyan('http://localhost:' + port + '/api')}`);
    console.log(`  ${c.dim('Docs')}     ${c.dim('https://phantombackxdocs.vercel.app')}`);
    console.log('');
    console.log(`  ${c.dim('─'.repeat(54))}`);
    console.log(`  ${c.dim('Press')} ${c.whiteB('Ctrl+C')} ${c.dim('to stop')}`);
    console.log('');
  },

  // ── Chaos inline log ─────────────────────────────────────────────────────────
  chaos: (...a) =>
    console.log(`  ${c.redB('⚡')} ${c.redB('REALITY')} ${c.dim('·')} ${c.white(a.join(' '))}`),

  // ── Route group header ────────────────────────────────────────────────────────
  routeGroup: (label) => {
    console.log('');
    console.log(`  ${c.dim('┌─')} ${c.violetB(label)}`);
    console.log('');
  },

  // ── Reality Mode banner ───────────────────────────────────────────────────────
  chaosBanner: (config) => {
    const W  = 54;
    const bv = c.redB;

    console.log('');
    console.log(boxTop(W, bv));
    console.log(boxEmpty(W, bv));
    console.log(boxRow(W, bv, c.redB('⚡  REALITY MODE') + c.dim('  —  ') + c.redB('CHAOS ACTIVE')));
    console.log(boxRow(W, bv, c.dim('Injecting real-world failures into your API')));
    console.log(boxEmpty(W, bv));
    console.log(boxBottom(W, bv));
    console.log('');

    if (!config) return;

    const scenarios = config.scenarios || [];
    const rows = [
      scenarios.includes('latency')    && [c.yellow('⏱  Latency Spikes'),     c.dim(`${config.latency?.min ?? 200}–${config.latency?.max ?? 5000} ms`)],
      scenarios.includes('failure')    && [c.red('✕  Random Failures'),       c.dim(`${((config.failureRate ?? 0.1) * 100).toFixed(0)}% of requests`)],
      scenarios.includes('drop')       && [c.pink('⊘  Connection Drops'),     c.dim(`${((config.connectionDropRate ?? 0.02) * 100).toFixed(0)}% of requests`)],
      scenarios.includes('corruption') && [c.orange('⌀  Response Corruption'), c.dim(`${((config.corruptionRate ?? 0.02) * 100).toFixed(0)}% of requests`)],
      scenarios.includes('timeout')    && [c.redB('◷  Request Timeouts'),     c.dim(`${((config.timeoutRate ?? 0.03) * 100).toFixed(0)}% of requests`)],
    ].filter(Boolean);

    if (rows.length === 0) return;

    console.log(`  ${c.dim('┌─ ACTIVE SCENARIOS' + '─'.repeat(36))}`);
    console.log('');
    rows.forEach(([label, value], i) => {
      const tree = i === rows.length - 1 ? '└─' : '├─';
      console.log(`  ${c.dim(tree)} ${label}   ${value}`);
    });
    console.log('');
  },

  // ── Init success screen ───────────────────────────────────────────────────────
  initSuccess: (configPath) => {
    const W  = 54;
    const bv = c.greenB;

    console.log('');
    console.log(boxTop(W, bv));
    console.log(boxEmpty(W, bv));
    console.log(boxRow(W, bv, c.greenB('✓  phantom.config.js created')));
    console.log(boxRow(W, bv, c.dim('Your config is ready to customize')));
    console.log(boxEmpty(W, bv));
    console.log(boxBottom(W, bv));
    console.log('');
    console.log(`  ${c.dim('Next steps:')}`);
    console.log('');
    console.log(`  ${c.dim('1.')} ${c.white('Edit')}  ${c.cyan(configPath)}`);
    console.log(`  ${c.dim('2.')} ${c.white('Run')}   ${c.violetB('phantomback start')}`);
    console.log('');
    console.log(`  ${c.dim('Docs')}  ${c.dim('https://phantombackxdocs.vercel.app')}`);
    console.log('');
  },
};
