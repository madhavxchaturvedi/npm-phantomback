/**
 * Sort records by field and order.
 *
 * Query params:
 *   ?sort=name&order=asc
 *   ?_sort=name&_order=desc
 *   ?sort=name,-age   (multi-field: comma-separated, prefix - for desc)
 */
export function applySort(records, query) {
  const sortParam = query.sort || query._sort;
  if (!sortParam) return records;

  const orderParam = (query.order || query._order || 'asc').toLowerCase();

  // Support multi-field sort: "name,-age,createdAt"
  const sortFields = sortParam.split(',').map((field) => {
    field = field.trim();
    if (field.startsWith('-')) {
      return { field: field.slice(1), order: 'desc' };
    }
    return { field, order: orderParam };
  });

  const sorted = [...records];
  sorted.sort((a, b) => {
    for (const { field, order } of sortFields) {
      const valA = a[field];
      const valB = b[field];

      if (valA === valB) continue;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      let comparison;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        comparison = valA < valB ? -1 : 1;
      }

      return order === 'desc' ? -comparison : comparison;
    }
    return 0;
  });

  return sorted;
}
