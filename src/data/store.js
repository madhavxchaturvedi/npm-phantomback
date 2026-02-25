import { generateId, timestamp, deepClone } from '../utils/helpers.js';

/**
 * In-memory data store for all resources.
 * Structure: Map<resourceName, Map<id, record>>
 */
export class DataStore {
  constructor() {
    /** @type {Map<string, Map<string, object>>} */
    this.collections = new Map();
  }

  /**
   * Initialize a collection for a resource
   */
  register(resourceName) {
    if (!this.collections.has(resourceName)) {
      this.collections.set(resourceName, new Map());
    }
    return this;
  }

  /**
   * Get all records from a resource
   */
  findAll(resourceName) {
    const collection = this.collections.get(resourceName);
    if (!collection) return [];
    return Array.from(collection.values()).map(deepClone);
  }

  /**
   * Get a single record by ID
   */
  findById(resourceName, id) {
    const collection = this.collections.get(resourceName);
    if (!collection) return null;
    const record = collection.get(id);
    return record ? deepClone(record) : null;
  }

  /**
   * Find records matching a filter function
   */
  findWhere(resourceName, filterFn) {
    return this.findAll(resourceName).filter(filterFn);
  }

  /**
   * Create a new record
   */
  create(resourceName, data) {
    const collection = this.collections.get(resourceName);
    if (!collection) {
      throw new Error(`Resource "${resourceName}" is not registered.`);
    }

    const now = timestamp();
    const record = {
      id: data.id || generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    collection.set(record.id, record);
    return deepClone(record);
  }

  /**
   * Bulk create records
   */
  createMany(resourceName, items) {
    return items.map((item) => this.create(resourceName, item));
  }

  /**
   * Update a record (full replace, keeps id + timestamps)
   */
  update(resourceName, id, data) {
    const collection = this.collections.get(resourceName);
    if (!collection) return null;

    const existing = collection.get(id);
    if (!existing) return null;

    const updated = {
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: timestamp(),
    };

    collection.set(id, updated);
    return deepClone(updated);
  }

  /**
   * Partial update a record (merge)
   */
  patch(resourceName, id, data) {
    const collection = this.collections.get(resourceName);
    if (!collection) return null;

    const existing = collection.get(id);
    if (!existing) return null;

    const patched = {
      ...existing,
      ...data,
      id, // prevent id override
      createdAt: existing.createdAt,
      updatedAt: timestamp(),
    };

    collection.set(id, patched);
    return deepClone(patched);
  }

  /**
   * Delete a record
   */
  delete(resourceName, id) {
    const collection = this.collections.get(resourceName);
    if (!collection) return false;
    return collection.delete(id);
  }

  /**
   * Count records in a resource
   */
  count(resourceName) {
    const collection = this.collections.get(resourceName);
    return collection ? collection.size : 0;
  }

  /**
   * Clear all records from a resource
   */
  clear(resourceName) {
    const collection = this.collections.get(resourceName);
    if (collection) collection.clear();
    return this;
  }

  /**
   * Reset the entire store
   */
  reset() {
    this.collections.clear();
    return this;
  }

  /**
   * Export the entire store as a plain object (for snapshots)
   */
  toJSON() {
    const result = {};
    for (const [name, collection] of this.collections) {
      result[name] = Array.from(collection.values());
    }
    return result;
  }

  /**
   * Import data from a plain object (restore snapshot)
   */
  fromJSON(data) {
    for (const [name, records] of Object.entries(data)) {
      this.register(name);
      const collection = this.collections.get(name);
      for (const record of records) {
        collection.set(record.id, record);
      }
    }
    return this;
  }
}

// Singleton store instance
export const store = new DataStore();
