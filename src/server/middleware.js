import cors from 'cors';
import express from 'express';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';

const METHOD_BADGE = {
  GET:    chalk.bgHex('#052e16').hex('#4ade80').bold,
  POST:   chalk.bgHex('#172554').hex('#60a5fa').bold,
  PUT:    chalk.bgHex('#422006').hex('#fbbf24').bold,
  PATCH:  chalk.bgHex('#2d1b69').hex('#f472b6').bold,
  DELETE: chalk.bgHex('#450a0a').hex('#f87171').bold,
};

/**
 * Create and configure the Express server with standard middleware
 */
export function createExpressApp(config) {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS (allow everything in dev)
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
  );

  // Request logger — compact per-request log
  app.use((req, _res, next) => {
    const badge = (METHOD_BADGE[req.method] || chalk.bgGray.white.bold)(` ${req.method.padEnd(6)}`);
    process.stdout.write(`  ${badge}  ${chalk.dim(req.originalUrl)}\n`);
    next();
  });

  // Health check
  app.get(`${config.prefix}/_health`, (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  return app;
}

/**
 * Add error handling middleware (call after all routes are registered)
 */
export function addErrorHandling(app) {
  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        status: 404,
        message: 'Route not found. Check your API prefix and resource names.',
      },
    });
  });

  // Global error handler
  app.use((err, _req, res, _next) => {
    logger.error(err.message);
    res.status(err.status || 500).json({
      success: false,
      error: {
        status: err.status || 500,
        message: err.message || 'Internal Server Error',
      },
    });
  });
}
