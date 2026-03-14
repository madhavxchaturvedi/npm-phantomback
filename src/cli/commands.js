import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from '../utils/logger.js';

/**
 * CLI command: phantomback init
 * Generates a starter phantom.config.js in the CWD
 */
export async function initCommand() {
  const configPath = resolve(process.cwd(), 'phantom.config.js');

  if (existsSync(configPath)) {
    logger.warn('phantom.config.js already exists. Skipping.');
    return;
  }

  const template = `// PhantomBack Configuration
// Docs: https://phantombackxdocs.vercel.app

export default {
  port: 3777,
  prefix: '/api',

  // Global response latency (ms). Use [min, max] for random range.
  // latency: 0,
  // latency: [200, 800],

  auth: {
    enabled: true,
    secret: 'my-super-secret-key',
    expiresIn: '24h',
  },

  resources: {
    users: {
      fields: {
        name: { type: 'name', required: true },
        email: { type: 'email', unique: true },
        username: { type: 'username' },
        avatar: { type: 'avatar' },
        age: { type: 'number', min: 18, max: 65 },
        role: { type: 'enum', values: ['admin', 'user', 'moderator'] },
      },
      seed: 25,     // Auto-generate 25 fake records
      auth: true,   // Protect CRUD with JWT token
    },

    posts: {
      fields: {
        title: { type: 'title', required: true },
        body: { type: 'paragraphs', count: 3 },
        slug: { type: 'slug' },
        image: { type: 'image' },
        published: { type: 'boolean' },
        views: { type: 'number', min: 0, max: 10000 },
        userId: { type: 'relation', resource: 'users' },
      },
      seed: 50,
    },

    comments: {
      fields: {
        body: { type: 'paragraph', required: true },
        rating: { type: 'rating' },
        userId: { type: 'relation', resource: 'users' },
        postId: { type: 'relation', resource: 'posts' },
      },
      seed: 100,
    },
  },

  // Chaos Engineering (Reality Mode)
  chaos: {
    enabled: false,
    // Latency jitter range (ms) — random delays injected on ~30% of requests
    latency: { min: 200, max: 5000 },
    // Probability (0-1) of returning a random 5xx error
    failureRate: 0.1,
    // HTTP error codes used for random failures
    errorCodes: [500, 502, 503, 504],
    // Probability of abruptly dropping the connection
    connectionDropRate: 0.02,
    // Probability of sending malformed/partial JSON
    corruptionRate: 0.02,
    // Probability of request hanging (30s timeout)
    timeoutRate: 0.03,
    // Which chaos scenarios to activate
    scenarios: ['latency', 'failure', 'drop', 'corruption', 'timeout'],
  },
};
`;

  writeFileSync(configPath, template, 'utf-8');
  logger.initSuccess('phantom.config.js');
}

/**
 * CLI command: phantomback start
 */
export async function startCommand(options) {
  const { parseConfig } = await import('../schema/parser.js');
  const { DEFAULT_RESOURCES } = await import('../schema/defaults.js');
  const { createServer } = await import('../server/createServer.js');

  logger.banner();

  let config;

  if (options.zero) {
    logger.info('Zero-config mode — spinning up demo backend...');
    config = await parseConfig({
      port: options.port || 3777,
      prefix: options.prefix || '/api',
      resources: DEFAULT_RESOURCES,
    });
  } else if (options.config) {
    config = await parseConfig(options.config);
  } else {
    config = await parseConfig(); // auto-find config file
  }

  // CLI overrides
  if (options.port) config.port = parseInt(options.port, 10);
  if (options.prefix) config.prefix = options.prefix;

  // Reality Mode (Chaos) CLI overrides
  if (options.chaos) {
    config.chaos = config.chaos || {};
    config.chaos.enabled = true;
  }
  if (options.chaosFailure !== undefined) {
    config.chaos = config.chaos || {};
    config.chaos.enabled = true;
    const rate = options.chaosFailure;
    if (rate < 0 || rate > 1) {
      logger.warn('--chaos-failure must be between 0 and 1. Clamping to valid range.');
    }
    config.chaos.failureRate = Math.max(0, Math.min(1, rate));
  }
  if (options.chaosLatency) {
    config.chaos = config.chaos || {};
    config.chaos.enabled = true;
    const parts = options.chaosLatency.split(',').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] >= 0 && parts[1] >= parts[0]) {
      config.chaos.latency = { min: parts[0], max: parts[1] };
    } else {
      logger.warn('Invalid --chaos-latency format. Expected "min,max" (e.g. "200,5000"). Using defaults.');
    }
  }

  // Check if using defaults (no config found and no resources)
  if (Object.keys(config.resources).length === 0) {
    logger.warn('No config found — using zero-config defaults.');
    config.resources = DEFAULT_RESOURCES;
  }

  const { stop } = await createServer(config);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('');
    logger.warn('Shutting down...');
    await stop();
    console.log('');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
