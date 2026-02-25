/**
 * Apply pagination to a list of records.
 *
 * Query params:
 *   ?page=1&limit=10
 *   ?_page=1&_limit=10
 *   ?offset=0&limit=10
 */
export function paginate(records, query) {
  const page = parseInt(query.page || query._page, 10) || 1;
  const limit = parseInt(query.limit || query._limit || query.per_page, 10) || 10;
  const offset = parseInt(query.offset, 10);

  const total = records.length;
  const totalPages = Math.ceil(total / limit);

  let start;
  if (!isNaN(offset)) {
    start = offset;
  } else {
    start = (page - 1) * limit;
  }

  const end = start + limit;
  const data = records.slice(start, end);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
