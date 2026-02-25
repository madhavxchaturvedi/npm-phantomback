import { randomUUID } from 'node:crypto';

/**
 * Generate a unique ID
 */
export function generateId() {
  return randomUUID().split('-')[0];
}

/**
 * Get current ISO timestamp
 */
export function timestamp() {
  return new Date().toISOString();
}

/**
 * Deep clone an object (structured clone)
 */
export function deepClone(obj) {
  return structuredClone(obj);
}

/**
 * Pick specific keys from an object
 */
export function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

/**
 * Omit specific keys from an object
 */
export function omit(obj, keys) {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pluralize a resource name (simple)
 */
export function pluralize(str) {
  if (str.endsWith('s')) return str;
  if (str.endsWith('y')) return str.slice(0, -1) + 'ies';
  return str + 's';
}

/**
 * Singularize a resource name (simple)
 */
export function singularize(str) {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

/**
 * Parse a string value to its proper type
 */
export function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}

/**
 * Check if a value matches a search query (case-insensitive)
 */
export function matchesSearch(value, query) {
  if (value === null || value === undefined) return false;
  return String(value).toLowerCase().includes(query.toLowerCase());
}

/**
 * Wrap an async Express handler to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send a standardized JSON response
 */
export function sendResponse(res, statusCode, data, meta = null) {
  const response = { success: statusCode >= 200 && statusCode < 300 };
  if (meta) response.meta = meta;
  if (data !== undefined) response.data = data;
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(res, statusCode, message, errors = null) {
  const response = {
    success: false,
    error: { status: statusCode, message },
  };
  if (errors) response.error.details = errors;
  return res.status(statusCode).json(response);
}
