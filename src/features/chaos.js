/**
 * Reality Mode — Chaos Engineering Middleware for PhantomBack
 *
 * Simulates real-world production instability during development:
 *   • Latency spikes (jitter)
 *   • Random HTTP failures (5xx errors)
 *   • Connection drops (socket destruction)
 *   • Response corruption (malformed JSON)
 *   • Request timeouts (hanging responses)
 *   • Out-of-order response delays
 *
 * Configuration:
 *   chaos: {
 *     enabled: true,
 *     latency:            { min: 200, max: 5000 },
 *     failureRate:        0.1,
 *     errorCodes:         [500, 502, 503, 504],
 *     connectionDropRate: 0.02,
 *     corruptionRate:     0.02,
 *     timeoutRate:        0.03,
 *     scenarios:          ['latency', 'failure', 'drop', 'corruption', 'timeout'],
 *   }
 */

import { logger } from '../utils/logger.js';

// ─── Default Chaos Configuration ─────────────────────────────────────────────

const DEFAULT_CHAOS_CONFIG = {
  enabled: false,
  latency: { min: 200, max: 5000 },
  failureRate: 0.1,
  errorCodes: [500, 502, 503, 504],
  connectionDropRate: 0.02,
  corruptionRate: 0.02,
  timeoutRate: 0.03,
  scenarios: ['latency', 'failure', 'drop', 'corruption', 'timeout'],
};

// ─── Chaos Engine ────────────────────────────────────────────────────────────

export class ChaosEngine {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CHAOS_CONFIG,
      ...config,
      latency: {
        ...DEFAULT_CHAOS_CONFIG.latency,
        ...(config.latency || {}),
      },
      errorCodes: config.errorCodes || DEFAULT_CHAOS_CONFIG.errorCodes,
      scenarios: config.scenarios || DEFAULT_CHAOS_CONFIG.scenarios,
    };
    this.stats = {
      totalRequests: 0,
      chaosApplied: 0,
      latencySpikes: 0,
      failures: 0,
      drops: 0,
      corruptions: 0,
      timeouts: 0,
      startedAt: new Date().toISOString(),
    };
    this.paused = false;
  }

  /** Check if a specific scenario is enabled */
  isScenarioEnabled(name) {
    return this.config.enabled && !this.paused && this.config.scenarios.includes(name);
  }

  /** Roll the dice — returns true with the given probability (0-1) */
  shouldTrigger(rate) {
    return Math.random() < rate;
  }

  /** Generate a random latency value within the configured jitter range */
  getJitter() {
    const { min, max } = this.config.latency;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Pick a random error code from the configured list */
  getRandomErrorCode() {
    const codes = this.config.errorCodes;
    return codes[Math.floor(Math.random() * codes.length)];
  }

  /** Enable chaos at runtime */
  enable() {
    this.config.enabled = true;
    this.paused = false;
    logger.chaos('Reality Mode ENABLED');
  }

  /** Disable chaos at runtime */
  disable() {
    this.config.enabled = false;
    logger.chaos('Reality Mode DISABLED');
  }

  /** Pause chaos temporarily */
  pause() {
    this.paused = true;
    logger.chaos('Reality Mode PAUSED');
  }

  /** Resume chaos after pause */
  resume() {
    this.paused = false;
    logger.chaos('Reality Mode RESUMED');
  }

  /** Update chaos configuration at runtime */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.chaos('Configuration updated');
  }

  /** Get current status and stats */
  getStatus() {
    return {
      enabled: this.config.enabled,
      paused: this.paused,
      active: this.config.enabled && !this.paused,
      config: this.config,
      stats: { ...this.stats },
    };
  }

  /** Reset stats counters */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      chaosApplied: 0,
      latencySpikes: 0,
      failures: 0,
      drops: 0,
      corruptions: 0,
      timeouts: 0,
      startedAt: new Date().toISOString(),
    };
  }
}

// ─── Chaos Scenarios ─────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  500: 'Internal Server Error — [Reality Mode] Simulated server crash',
  502: 'Bad Gateway — [Reality Mode] Upstream service unavailable',
  503: 'Service Unavailable — [Reality Mode] Server overloaded',
  504: 'Gateway Timeout — [Reality Mode] Upstream request timed out',
};

/**
 * Scenario: Latency Spike
 * Adds a random delay to simulate network jitter or slow backends
 */
function applyLatencySpike(engine, _req, _res) {
  if (!engine.isScenarioEnabled('latency')) return null;
  if (!engine.shouldTrigger(0.3)) return null; // 30% of requests get jitter

  const delay = engine.getJitter();
  engine.stats.latencySpikes++;

  return new Promise((resolve) => {
    logger.chaos(`Latency spike: +${delay}ms`);
    setTimeout(resolve, delay);
  });
}

/**
 * Scenario: Random Failure
 * Returns a random 5xx error response
 */
function applyFailure(engine, _req, res) {
  if (!engine.isScenarioEnabled('failure')) return false;
  if (!engine.shouldTrigger(engine.config.failureRate)) return false;

  const code = engine.getRandomErrorCode();
  engine.stats.failures++;

  logger.chaos(`Random failure: HTTP ${code}`);
  res.status(code).json({
    success: false,
    error: {
      status: code,
      message: ERROR_MESSAGES[code] || `HTTP ${code} — [Reality Mode] Simulated failure`,
      chaos: true,
    },
  });

  return true;
}

/**
 * Scenario: Connection Drop
 * Destroys the socket mid-request to simulate network issues
 */
function applyConnectionDrop(engine, req, _res) {
  if (!engine.isScenarioEnabled('drop')) return false;
  if (!engine.shouldTrigger(engine.config.connectionDropRate)) return false;

  engine.stats.drops++;
  logger.chaos(`Connection drop: ${req.method} ${req.originalUrl}`);

  // Destroy the underlying socket
  if (req.socket) {
    req.socket.destroy();
  }

  return true;
}

/**
 * Scenario: Response Corruption
 * Sends back malformed/partial JSON to test error handling
 */
function applyCorruption(engine, req, res) {
  if (!engine.isScenarioEnabled('corruption')) return false;
  if (!engine.shouldTrigger(engine.config.corruptionRate)) return false;

  engine.stats.corruptions++;
  logger.chaos(`Response corruption: ${req.method} ${req.originalUrl}`);

  // Pick a random corruption type
  const corruptions = [
    // Truncated JSON
    () => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).end('{"success":true,"data":[{"id":"abc","na');
    },
    // Invalid JSON
    () => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).end('{success: true, data: undefined}');
    },
    // Empty body with 200
    () => {
      res.status(200).end('');
    },
    // Wrong content type
    () => {
      res.setHeader('Content-Type', 'text/html');
      res.status(200).end('<html><body>Unexpected HTML response</body></html>');
    },
    // Partial response with wrong status
    () => {
      res.status(206).json({
        success: true,
        data: null,
        error: { message: '[Reality Mode] Partial response — data truncated' },
        chaos: true,
      });
    },
  ];

  const corrupt = corruptions[Math.floor(Math.random() * corruptions.length)];
  corrupt();
  return true;
}

/**
 * Scenario: Request Timeout
 * Holds the connection open without responding (simulates hung backend)
 */
function applyTimeout(engine, req, _res) {
  if (!engine.isScenarioEnabled('timeout')) return false;
  if (!engine.shouldTrigger(engine.config.timeoutRate)) return false;

  engine.stats.timeouts++;
  logger.chaos(`Request timeout: ${req.method} ${req.originalUrl} (hanging for 30s)`);

  // Return a promise that resolves after 30s (or until client gives up)
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 30000);

    // Clean up if client disconnects
    req.on('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

// ─── Main Chaos Middleware ───────────────────────────────────────────────────

/**
 * Create the Reality Mode middleware.
 * This is the main entry point — attach to Express before resource routes.
 *
 * @param {ChaosEngine} engine - Chaos engine instance
 * @returns {Function} Express middleware
 */
export function chaosMiddleware(engine) {
  return async (req, res, next) => {
    engine.stats.totalRequests++;

    // Skip if chaos is disabled or paused
    if (!engine.config.enabled || engine.paused) {
      return next();
    }

    // Skip chaos control endpoints
    if (req.path.includes('/_chaos')) {
      return next();
    }

    // Skip health check
    if (req.path.includes('/_health')) {
      return next();
    }

    // Add chaos header so clients know Reality Mode is active
    res.setHeader('X-PhantomBack-Chaos', 'active');

    // ── Execute scenarios in priority order ──

    // 1. Connection Drop (highest priority — immediate termination)
    if (applyConnectionDrop(engine, req, res)) {
      engine.stats.chaosApplied++;
      return; // Socket destroyed, nothing more to do
    }

    // 2. Request Timeout (holds connection)
    const timeoutResult = applyTimeout(engine, req, res);
    if (timeoutResult instanceof Promise) {
      engine.stats.chaosApplied++;
      await timeoutResult;
      // After timeout, destroy the socket (client likely already disconnected)
      if (req.socket && !req.socket.destroyed) {
        req.socket.destroy();
      }
      return;
    }

    // 3. Random Failure (returns error response)
    if (applyFailure(engine, req, res)) {
      engine.stats.chaosApplied++;
      return;
    }

    // 4. Response Corruption (sends malformed data)
    if (applyCorruption(engine, req, res)) {
      engine.stats.chaosApplied++;
      return;
    }

    // 5. Latency Spike (adds delay, then continues to real handler)
    const latencyResult = applyLatencySpike(engine, req, res);
    if (latencyResult instanceof Promise) {
      engine.stats.chaosApplied++;
      await latencyResult;
    }

    // If no chaos blocked the request, proceed normally
    next();
  };
}

// ─── Chaos Control Routes ────────────────────────────────────────────────────

/**
 * Register chaos control endpoints on the Express app.
 * These allow runtime control of Reality Mode.
 *
 * Routes:
 *   GET  {prefix}/_chaos            — Status & stats
 *   POST {prefix}/_chaos/enable     — Enable chaos
 *   POST {prefix}/_chaos/disable    — Disable chaos
 *   POST {prefix}/_chaos/pause      — Pause chaos
 *   POST {prefix}/_chaos/resume     — Resume chaos
 *   POST {prefix}/_chaos/configure  — Update config
 *   POST {prefix}/_chaos/reset      — Reset stats
 */
export function createChaosRoutes(app, engine, config) {
  const prefix = config.prefix || '/api';

  // GET /_chaos — status dashboard
  app.get(`${prefix}/_chaos`, (_req, res) => {
    const status = engine.getStatus();
    res.json({
      success: true,
      message: status.active
        ? '🔥 Reality Mode is ACTIVE — chaos is being injected!'
        : '😴 Reality Mode is inactive',
      ...status,
    });
  });

  // POST /_chaos/enable
  app.post(`${prefix}/_chaos/enable`, (_req, res) => {
    engine.enable();
    res.json({
      success: true,
      message: '🔥 Reality Mode ENABLED — brace yourself!',
      ...engine.getStatus(),
    });
  });

  // POST /_chaos/disable
  app.post(`${prefix}/_chaos/disable`, (_req, res) => {
    engine.disable();
    res.json({
      success: true,
      message: '😴 Reality Mode DISABLED — back to calm waters',
      ...engine.getStatus(),
    });
  });

  // POST /_chaos/pause
  app.post(`${prefix}/_chaos/pause`, (_req, res) => {
    engine.pause();
    res.json({
      success: true,
      message: '⏸️  Reality Mode PAUSED',
      ...engine.getStatus(),
    });
  });

  // POST /_chaos/resume
  app.post(`${prefix}/_chaos/resume`, (_req, res) => {
    engine.resume();
    res.json({
      success: true,
      message: '▶️  Reality Mode RESUMED',
      ...engine.getStatus(),
    });
  });

  // POST /_chaos/configure — update chaos config at runtime
  app.post(`${prefix}/_chaos/configure`, (req, res) => {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: 'Request body must be a JSON object with chaos config' },
      });
    }

    engine.configure(updates);
    res.json({
      success: true,
      message: '⚙️  Chaos configuration updated',
      ...engine.getStatus(),
    });
  });

  // POST /_chaos/reset — reset stats
  app.post(`${prefix}/_chaos/reset`, (_req, res) => {
    engine.resetStats();
    res.json({
      success: true,
      message: '📊 Chaos stats reset',
      ...engine.getStatus(),
    });
  });

  // Log registered chaos routes — silenced, shown in table summary
}
