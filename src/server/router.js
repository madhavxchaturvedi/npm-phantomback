import express from 'express';
import { paginate } from '../features/pagination.js';
import { applyFilters } from '../features/filters.js';
import { applySort } from '../features/sorting.js';
import { applySearch } from '../features/search.js';
import { authMiddleware } from '../features/auth.js';
import { delayMiddleware } from '../features/delay.js';
import { validationMiddleware } from '../schema/validator.js';
import { detectRelations, getChildren } from '../data/relations.js';
import { asyncHandler, sendResponse, sendError } from '../utils/helpers.js';

/**
 * Generate REST CRUD routes for all resources
 */
export function createRouter(config, store) {
  const router = express.Router();
  const { resources, prefix } = config;
  const relations = detectRelations(resources);

  // Apply global latency
  if (config.latency) {
    router.use(delayMiddleware(config.latency));
  }

  // Info endpoint: list all available routes
  router.get(`${prefix}`, (_req, res) => {
    const endpoints = {};
    for (const name of Object.keys(resources)) {
      endpoints[name] = {
        list: `GET ${prefix}/${name}`,
        getOne: `GET ${prefix}/${name}/:id`,
        create: `POST ${prefix}/${name}`,
        update: `PUT ${prefix}/${name}/:id`,
        patch: `PATCH ${prefix}/${name}/:id`,
        delete: `DELETE ${prefix}/${name}/:id`,
      };

      // Add nested routes info
      const children = getChildren(name, relations);
      if (children.length > 0) {
        endpoints[name].nested = children.map(
          (c) => `GET ${prefix}/${name}/:id/${c.childResource}`,
        );
      }
    }

    res.json({
      success: true,
      message: '👻 PhantomBack API is running!',
      endpoints,
    });
  });

  // Generate routes for each resource
  for (const [resourceName, schema] of Object.entries(resources)) {
    const fields = schema.fields || {};
    const basePath = `${prefix}/${resourceName}`;
    const resourceAuth = schema.auth || false;
    const secret = config.auth?.secret;

    // Optionally protect routes with auth
    const protect = resourceAuth ? [authMiddleware(secret)] : [];

    // Per-resource latency
    if (schema.latency) {
      router.use(basePath, delayMiddleware(schema.latency));
    }

    // ─── GET /resource ─── List all with pagination, filtering, sorting, search
    router.get(
      basePath,
      ...protect,
      asyncHandler(async (req, res) => {
        let records = store.findAll(resourceName);

        // Apply search
        records = applySearch(records, req.query);

        // Apply filters
        records = applyFilters(records, req.query);

        // Apply sort
        records = applySort(records, req.query);

        // Field selection
        const selectParam = req.query.fields || req.query._fields || req.query.select;
        if (selectParam) {
          const selectedFields = selectParam.split(',').map((f) => f.trim());
          records = records.map((record) => {
            const picked = { id: record.id };
            for (const f of selectedFields) {
              if (f in record) picked[f] = record[f];
            }
            return picked;
          });
        }

        // Apply pagination
        const { data, meta } = paginate(records, req.query);

        return sendResponse(res, 200, data, meta);
      }),
    );

    // ─── GET /resource/:id ─── Get one by ID
    router.get(
      `${basePath}/:id`,
      ...protect,
      asyncHandler(async (req, res) => {
        const record = store.findById(resourceName, req.params.id);
        if (!record) {
          return sendError(res, 404, `${resourceName} with id "${req.params.id}" not found`);
        }
        return sendResponse(res, 200, record);
      }),
    );

    // ─── POST /resource ─── Create new record
    router.post(
      basePath,
      ...protect,
      validationMiddleware(fields, false),
      asyncHandler(async (req, res) => {
        // Unique field check
        const uniqueError = checkUnique(resourceName, fields, req.validatedBody, store);
        if (uniqueError) {
          return sendError(res, 409, uniqueError);
        }

        const record = store.create(resourceName, req.validatedBody);
        return sendResponse(res, 201, record);
      }),
    );

    // ─── PUT /resource/:id ─── Full update
    router.put(
      `${basePath}/:id`,
      ...protect,
      validationMiddleware(fields, false),
      asyncHandler(async (req, res) => {
        const existing = store.findById(resourceName, req.params.id);
        if (!existing) {
          return sendError(res, 404, `${resourceName} with id "${req.params.id}" not found`);
        }

        // Unique check (exclude current record)
        const uniqueError = checkUnique(
          resourceName,
          fields,
          req.validatedBody,
          store,
          req.params.id,
        );
        if (uniqueError) {
          return sendError(res, 409, uniqueError);
        }

        const updated = store.update(resourceName, req.params.id, req.validatedBody);
        return sendResponse(res, 200, updated);
      }),
    );

    // ─── PATCH /resource/:id ─── Partial update
    router.patch(
      `${basePath}/:id`,
      ...protect,
      validationMiddleware(fields, true),
      asyncHandler(async (req, res) => {
        const existing = store.findById(resourceName, req.params.id);
        if (!existing) {
          return sendError(res, 404, `${resourceName} with id "${req.params.id}" not found`);
        }

        const uniqueError = checkUnique(
          resourceName,
          fields,
          req.validatedBody,
          store,
          req.params.id,
        );
        if (uniqueError) {
          return sendError(res, 409, uniqueError);
        }

        const patched = store.patch(resourceName, req.params.id, req.validatedBody);
        return sendResponse(res, 200, patched);
      }),
    );

    // ─── DELETE /resource/:id ─── Delete
    router.delete(
      `${basePath}/:id`,
      ...protect,
      asyncHandler(async (req, res) => {
        const existing = store.findById(resourceName, req.params.id);
        if (!existing) {
          return sendError(res, 404, `${resourceName} with id "${req.params.id}" not found`);
        }

        store.delete(resourceName, req.params.id);
        return sendResponse(res, 200, {
          message: `${resourceName} deleted successfully`,
          id: req.params.id,
        });
      }),
    );

    // ─── Nested routes ─── GET /resource/:id/childResource
    const children = getChildren(resourceName, relations);
    for (const relation of children) {
      const nestedPath = `${basePath}/:id/${relation.childResource}`;

      router.get(
        nestedPath,
        ...protect,
        asyncHandler(async (req, res) => {
          // Verify parent exists
          const parent = store.findById(resourceName, req.params.id);
          if (!parent) {
            return sendError(res, 404, `${resourceName} with id "${req.params.id}" not found`);
          }

          // Find child records where foreignKey === parent id
          let records = store.findWhere(relation.childResource, (record) => {
            return record[relation.foreignKey] === req.params.id;
          });

          records = applySearch(records, req.query);
          records = applyFilters(records, req.query);
          records = applySort(records, req.query);

          const { data, meta } = paginate(records, req.query);
          return sendResponse(res, 200, data, meta);
        }),
      );

      // nested route registered silently
    }

    // routes registered silently — summary shown in logger.table()
  }

  return router;
}

/**
 * Check unique constraints on fields
 */
function checkUnique(resourceName, fields, data, store, excludeId = null) {
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const def = typeof fieldDef === 'string' ? { type: fieldDef } : fieldDef;
    if (!def.unique) continue;

    const value = data[fieldName];
    if (value === undefined) continue;

    const existing = store.findAll(resourceName).find((r) => {
      return r[fieldName] === value && r.id !== excludeId;
    });

    if (existing) {
      return `A ${resourceName} with ${fieldName} "${value}" already exists`;
    }
  }

  return null;
}
