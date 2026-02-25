import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  port: 3777,
  prefix: '/api',
  latency: 0,
  auth: {
    enabled: false,
    secret: 'phantomback-secret-key',
    expiresIn: '24h',
  },
  chaos: {
    enabled: false,
  },
  resources: {},
  snapshot: false,
};

/**
 * Parse configuration from file or object
 */
export async function parseConfig(configPathOrObject) {
  // If already an object, merge with defaults
  if (configPathOrObject && typeof configPathOrObject === 'object') {
    return mergeConfig(configPathOrObject);
  }

  // Try to find config file
  const configPath = configPathOrObject || (await findConfigFile());

  if (!configPath) {
    return { ...DEFAULT_CONFIG };
  }

  const ext = configPath.split('.').pop();
  let userConfig;

  if (ext === 'json') {
    const raw = readFileSync(configPath, 'utf-8');
    userConfig = JSON.parse(raw);
  } else if (ext === 'js' || ext === 'mjs') {
    const fileUrl = pathToFileURL(resolve(configPath)).href;
    const mod = await import(fileUrl);
    userConfig = mod.default || mod;
  } else {
    throw new Error(`Unsupported config file format: .${ext}`);
  }

  return mergeConfig(userConfig);
}

/**
 * Search for config file in CWD
 */
async function findConfigFile() {
  const cwd = process.cwd();
  const candidates = [
    'phantom.config.js',
    'phantom.config.mjs',
    'phantom.config.json',
    '.phantomrc.json',
    '.phantomrc.js',
  ];

  for (const name of candidates) {
    const fullPath = resolve(cwd, name);
    if (existsSync(fullPath)) return fullPath;
  }

  return null;
}

/**
 * Merge user config with defaults
 */
function mergeConfig(userConfig) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    auth: {
      ...DEFAULT_CONFIG.auth,
      ...(userConfig.auth || {}),
    },
    chaos: {
      ...DEFAULT_CONFIG.chaos,
      ...(userConfig.chaos || {}),
    },
  };
}
