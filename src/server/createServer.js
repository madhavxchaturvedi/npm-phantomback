import { createExpressApp, addErrorHandling } from './middleware.js';
import { createRouter } from './router.js';
import { createAuthRoutes } from '../features/auth.js';
import { ChaosEngine, chaosMiddleware, createChaosRoutes } from '../features/chaos.js';
import { seedAll } from '../data/seeder.js';
import { DataStore } from '../data/store.js';
import { logger, createSpinner, sleep } from '../utils/logger.js';

/**
 * Create and start a PhantomBack server instance
 *
 * @param {object} config - Parsed configuration object
 * @returns {{ app, server, store, stop, reset, getStore }}
 */
export async function createServer(config) {
  const store = new DataStore();
  const app = createExpressApp(config);

  // ── Step 1: Chaos Engine ───────────────────────────────────────────────────
  const chaosConfig = config.chaos || {};
  const chaos = new ChaosEngine(chaosConfig);
  createChaosRoutes(app, chaos, config);
  app.use(chaosMiddleware(chaos));

  if (chaosConfig.enabled) {
    logger.chaosBanner(chaosConfig);
  }

  // ── Step 2: Seed data with spinner ─────────────────────────────────────────
  const resourceCount = Object.keys(config.resources).length;
  const spinner = createSpinner(`Seeding ${resourceCount} resource${resourceCount !== 1 ? 's' : ''}...`);
  spinner.start();
  await sleep(30); // let spinner render at least one frame
  seedAll(config.resources, store);
  const totalRecords = Object.keys(config.resources).reduce((sum, name) => sum + store.count(name), 0);
  spinner.stop(`Seeded ${totalRecords} records across ${resourceCount} resource${resourceCount !== 1 ? 's' : ''}`);

  // ── Step 3: Register routes with spinner ───────────────────────────────────
  const routeSpinner = createSpinner('Registering routes...');
  routeSpinner.start();
  await sleep(20);

  const hasAuth = Object.values(config.resources).some((r) => r.auth);
  if (hasAuth) {
    createAuthRoutes(app, store, config);
  }

  const router = createRouter(config, store);
  app.use(router);
  addErrorHandling(app);

  const routeCount = Object.keys(config.resources).length * 6 + (hasAuth ? 3 : 0);
  routeSpinner.stop(`${routeCount} routes registered`);

  // ── Step 4: Start server ───────────────────────────────────────────────────
  const listenSpinner = createSpinner(`Starting server on port ${config.port}...`);
  listenSpinner.start();

  const server = await new Promise((resolve) => {
    const srv = app.listen(config.port, () => resolve(srv));
  });

  listenSpinner.stop(`Listening on port ${config.port}`);

  // ── Step 5: Print resource table + ready screen ────────────────────────────
  console.log('');
  logger.table(config.resources, store, config.prefix, hasAuth);
  logger.server(config.port);

  return {
    app,
    server,
    store,
    chaos,
    stop: () =>
      new Promise((resolve) => {
        server.close(resolve);
      }),
    reset: () => {
      store.reset();
      seedAll(config.resources, store);
      logger.info('Store reset and re-seeded');
    },
    getStore: () => store.toJSON(),
    getChaos: () => chaos.getStatus(),
  };
}
