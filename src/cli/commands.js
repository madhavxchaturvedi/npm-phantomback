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
// Docs: https://github.com/phantomback/phantomback

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

  // Chaos Engineering (Reality Mode) — Phase 2
  // chaos: {
  //   enabled: true,
  //   jitter: { min: 100, max: 3000 },
  //   failureRate: 0.1,
  //   duplicateRate: 0.05,
  //   connectionDropRate: 0.02,
  // },
};
`;

  writeFileSync(configPath, template, 'utf-8');
  logger.success(`Created ${configPath}`);
  logger.info('Edit the file to define your resources, then run: phantomback start');
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
    logger.info('Zero-config mode: generating demo backend...');
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

  // Check if using defaults (no config found and no resources)
  if (Object.keys(config.resources).length === 0) {
    logger.warn('No config found and no resources defined. Using zero-config defaults.');
    config.resources = DEFAULT_RESOURCES;
  }

  logger.table(config.resources);

  const { stop } = await createServer(config);

  logger.server(config.port);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
