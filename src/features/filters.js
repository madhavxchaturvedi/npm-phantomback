import { parseValue } from '../utils/helpers.js';

/**
 * Filter records by query parameters.
 *
 * Supports:
 *   ?field=value          → exact match
 *   ?field_gte=10         → greater than or equal
 *   ?field_lte=100        → less than or equal
 *   ?field_gt=10          → greater than
 *   ?field_lt=100         → less than
 *   ?field_ne=value       → not equal
 *   ?field_like=text      → contains (case-insensitive)
 */
const RESERVED_PARAMS = new Set([
  'page',
  '_page',
  'limit',
  '_limit',
  'per_page',
  'offset',
  'sort',
  '_sort',
  'order',
  '_order',
  'q',
  '_q',
  'search',
  'fields',
  '_fields',
  'select',
  '_embed',
  '_expand',
]);

const OPERATORS = ['_gte', '_lte', '_gt', '_lt', '_ne', '_like'];

export function applyFilters(records, query) {
  let filtered = [...records];

  for (const [key, rawValue] of Object.entries(query)) {
    if (RESERVED_PARAMS.has(key)) continue;

    // Check for operator suffix
    let fieldName = key;
    let operator = 'eq';

    for (const op of OPERATORS) {
      if (key.endsWith(op)) {
        fieldName = key.slice(0, -op.length);
        operator = op.slice(1); // remove leading _
        break;
      }
    }

    const value = parseValue(rawValue);

    filtered = filtered.filter((record) => {
      const fieldValue = record[fieldName];
      if (fieldValue === undefined) return true;

      switch (operator) {
        case 'eq':
          return fieldValue == value; // loose equality intentional for string/number matching
        case 'ne':
          return fieldValue != value;
        case 'gt':
          return fieldValue > value;
        case 'gte':
          return fieldValue >= value;
        case 'lt':
          return fieldValue < value;
        case 'lte':
          return fieldValue <= value;
        case 'like':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        default:
          return true;
      }
    });
  }

  return filtered;
}
