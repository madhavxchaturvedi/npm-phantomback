import { createExpressApp, addErrorHandling } from './middleware.js';
import { createRouter } from './router.js';
import { createAuthRoutes } from '../features/auth.js';
import { seedAll } from '../data/seeder.js';
import { DataStore } from '../data/store.js';
import { logger } from '../utils/logger.js';

/**
 * Create and start a PhantomBack server instance
 *
 * @param {object} config - Parsed configuration object
 * @returns {{ app, server, store, stop, reset, getStore }}
 */
export async function createServer(config) {
  const store = new DataStore();
  const app = createExpressApp(config);

  // Seed data
  seedAll(config.resources, store);

  // Register auth routes if any resource uses auth
  const hasAuth = Object.values(config.resources).some((r) => r.auth);
  if (hasAuth) {
    createAuthRoutes(app, store, config);
    logger.route('POST', `${config.prefix}/auth/register`);
    logger.route('POST', `${config.prefix}/auth/login`);
    logger.route('GET', `${config.prefix}/auth/me`);
  }

  // Register resource routes
  const router = createRouter(config, store);
  app.use(router);

  // Error handling (must be last)
  addErrorHandling(app);

  // Start listening
  const server = await new Promise((resolve) => {
    const srv = app.listen(config.port, () => resolve(srv));
  });

  return {
    app,
    server,
    store,
    stop: () =>
      new Promise((resolve) => {
        server.close(resolve);
      }),
    reset: () => {
      store.reset();
      seedAll(config.resources, store);
      logger.info('Store has been reset and re-seeded');
    },
    getStore: () => store.toJSON(),
  };
}
