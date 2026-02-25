import { matchesSearch } from '../utils/helpers.js';

/**
 * Full-text search across all string fields.
 *
 * Query params:
 *   ?q=search+term
 *   ?_q=search+term
 *   ?search=search+term
 */
export function applySearch(records, query) {
  const searchTerm = query.q || query._q || query.search;
  if (!searchTerm) return records;

  return records.filter((record) => {
    return Object.values(record).some((value) => matchesSearch(value, searchTerm));
  });
}
