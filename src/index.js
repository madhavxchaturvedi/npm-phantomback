import { createServer } from './server/createServer.js';
import { parseConfig } from './schema/parser.js';
import { DEFAULT_RESOURCES } from './schema/defaults.js';
import { logger } from './utils/logger.js';

/**
 * PhantomBack — Instant Fake Backend Generator
 *
 * Library API entry point.
 *
 * @example
 * ```js
 * import { createPhantom } from 'phantomback';
 *
 * const phantom = await createPhantom({
 *   port: 3777,
 *   resources: {
 *     users: {
 *       fields: {
 *         name: { type: 'name', required: true },
 *         email: { type: 'email', unique: true },
 *       },
 *       seed: 25,
 *     },
 *   },
 * });
 *
 * // phantom.stop()   — stop the server
 * // phantom.reset()  — reset & re-seed all data
 * // phantom.getStore() — export current data as JSON
 * ```
 */
export async function createPhantom(userConfig = {}) {
  const config = await parseConfig(userConfig);

  // If no resources defined, use defaults
  if (Object.keys(config.resources).length === 0) {
    config.resources = DEFAULT_RESOURCES;
  }

  logger.banner();
  logger.table(config.resources);

  const instance = await createServer(config);

  logger.server(config.port);

  return instance;
}

/**
 * Create a zero-config phantom backend
 * One line → full demo API
 */
export async function createPhantomZero(port = 3777) {
  return createPhantom({
    port,
    resources: DEFAULT_RESOURCES,
  });
}

// Named exports for advanced usage
export { createServer } from './server/createServer.js';
export { parseConfig } from './schema/parser.js';
export { DEFAULT_RESOURCES } from './schema/defaults.js';
export { DataStore } from './data/store.js';
export { ChaosEngine, chaosMiddleware, createChaosRoutes } from './features/chaos.js';
export { logger } from './utils/logger.js';
