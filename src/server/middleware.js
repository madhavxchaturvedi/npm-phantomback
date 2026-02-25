import cors from 'cors';
import express from 'express';
import { logger } from '../utils/logger.js';

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

  // Request logger
  app.use((req, _res, next) => {
    logger.route(req.method, req.originalUrl);
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
