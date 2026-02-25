/**
 * Detect and build relation metadata between resources.
 * Used for auto-generating nested routes like GET /users/:id/posts
 */
export function detectRelations(resources) {
  const relations = {};

  for (const [resourceName, schema] of Object.entries(resources)) {
    const fields = schema.fields || {};

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      const def = typeof fieldDef === 'string' ? { type: fieldDef } : fieldDef;

      if (def.type === 'relation' && def.resource) {
        // This resource has a foreign key to def.resource
        // e.g., posts.userId → users
        if (!relations[def.resource]) {
          relations[def.resource] = [];
        }

        relations[def.resource].push({
          childResource: resourceName,
          foreignKey: fieldName,
          parentResource: def.resource,
        });

        // Also store on the child side
        if (!relations[resourceName]) {
          relations[resourceName] = [];
        }

        relations[resourceName].push({
          parentResource: def.resource,
          foreignKey: fieldName,
          childResource: resourceName,
          direction: 'belongsTo',
        });
      }
    }
  }

  return relations;
}

/**
 * Get child resources for a parent (for nested routes)
 */
export function getChildren(resourceName, relations) {
  if (!relations[resourceName]) return [];
  return relations[resourceName].filter((r) => r.childResource !== resourceName || !r.direction);
}

/**
 * Get parent resources for a child (for nested routes)
 */
export function getParents(resourceName, relations) {
  if (!relations[resourceName]) return [];
  return relations[resourceName].filter((r) => r.direction === 'belongsTo');
}
