import { sendError } from '../utils/helpers.js';

/**
 * Validate incoming request body against the resource schema fields
 */
export function validateBody(fields, body, isPartial = false) {
  const errors = [];
  const sanitized = {};

  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: [{ field: '_body', message: 'Request body must be a JSON object' }],
      data: null,
    };
  }

  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const def = typeof fieldDef === 'string' ? { type: fieldDef } : fieldDef;
    const value = body[fieldName];

    // Skip relation fields — they're managed by the client directly
    if (def.type === 'relation') {
      if (value !== undefined) {
        sanitized[fieldName] = value;
      }
      continue;
    }

    // Required check (only for full updates, not patches)
    if (!isPartial && def.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: fieldName, message: `"${fieldName}" is required` });
      continue;
    }

    // If not provided on partial update, skip
    if (value === undefined) {
      if (!isPartial) {
        // For full creates, use whatever default the field has
        sanitized[fieldName] = value;
      }
      continue;
    }

    // Type validation
    const typeError = validateType(fieldName, value, def);
    if (typeError) {
      errors.push(typeError);
      continue;
    }

    // Range validation
    if (def.min !== undefined && typeof value === 'number' && value < def.min) {
      errors.push({ field: fieldName, message: `"${fieldName}" must be at least ${def.min}` });
      continue;
    }
    if (def.max !== undefined && typeof value === 'number' && value > def.max) {
      errors.push({ field: fieldName, message: `"${fieldName}" must be at most ${def.max}` });
      continue;
    }

    // Unique check is done at the route level (needs store access)

    // Enum validation
    if (def.type === 'enum' && def.values && !def.values.includes(value)) {
      errors.push({
        field: fieldName,
        message: `"${fieldName}" must be one of: ${def.values.join(', ')}`,
      });
      continue;
    }

    // Email format
    if (def.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push({ field: fieldName, message: `"${fieldName}" must be a valid email address` });
      continue;
    }

    sanitized[fieldName] = value;
  }

  // Allow extra fields not in schema (flexible mode)
  for (const [key, value] of Object.entries(body)) {
    if (!(key in fields) && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
      sanitized[key] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized,
  };
}

/**
 * Validate a single field's type
 */
function validateType(fieldName, value, def) {
  const type = def.type;

  switch (type) {
    case 'number':
    case 'float':
    case 'price':
    case 'rating':
      if (typeof value !== 'number') {
        return { field: fieldName, message: `"${fieldName}" must be a number` };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field: fieldName, message: `"${fieldName}" must be a boolean` };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { field: fieldName, message: `"${fieldName}" must be an array` };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { field: fieldName, message: `"${fieldName}" must be an object` };
      }
      break;

    // String-like types — accept strings
    default:
      if (typeof value !== 'string' && typeof value !== 'number') {
        return { field: fieldName, message: `"${fieldName}" must be a string` };
      }
      break;
  }

  return null;
}

/**
 * Express middleware factory: validate request body
 */
export function validationMiddleware(fields, isPartial = false) {
  return (req, res, next) => {
    const { valid, errors, data } = validateBody(fields, req.body, isPartial);
    if (!valid) {
      return sendError(res, 400, 'Validation failed', errors);
    }
    req.validatedBody = data;
    next();
  };
}
