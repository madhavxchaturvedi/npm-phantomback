import { faker } from '@faker-js/faker';
import { generateId } from '../utils/helpers.js';

/**
 * Map of schema field types → Faker generators
 */
const FIELD_GENERATORS = {
  // People
  name: () => faker.person.fullName(),
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
  username: () => faker.internet.username(),
  email: () => faker.internet.email(),
  avatar: () => faker.image.avatar(),
  bio: () => faker.person.bio(),
  jobTitle: () => faker.person.jobTitle(),
  phone: () => faker.phone.number(),

  // Text
  word: () => faker.lorem.word(),
  sentence: () => faker.lorem.sentence(),
  paragraph: () => faker.lorem.paragraph(),
  paragraphs: (opts) => faker.lorem.paragraphs(opts?.count || 3),
  slug: () => faker.lorem.slug(),
  title: () => faker.lorem.sentence({ min: 3, max: 8 }),
  description: () => faker.lorem.sentences({ min: 2, max: 4 }),
  text: () => faker.lorem.text(),

  // Numbers
  number: (opts) => faker.number.int({ min: opts?.min ?? 0, max: opts?.max ?? 1000 }),
  float: (opts) =>
    faker.number.float({
      min: opts?.min ?? 0,
      max: opts?.max ?? 1000,
      fractionDigits: opts?.precision ?? 2,
    }),
  price: () => faker.commerce.price({ min: 1, max: 500, dec: 2 }),
  rating: () => faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),

  // Boolean
  boolean: () => faker.datatype.boolean(),

  // Dates
  date: () => faker.date.recent({ days: 365 }).toISOString(),
  pastDate: () => faker.date.past().toISOString(),
  futureDate: () => faker.date.future().toISOString(),
  birthdate: () => faker.date.birthdate().toISOString().split('T')[0],

  // Internet
  url: () => faker.internet.url(),
  image: () => faker.image.url(),
  ip: () => faker.internet.ip(),
  color: () => faker.color.human(),
  hex: () => faker.color.rgb(),

  // Address
  address: () => faker.location.streetAddress(),
  city: () => faker.location.city(),
  country: () => faker.location.country(),
  zipCode: () => faker.location.zipCode(),
  latitude: () => faker.location.latitude(),
  longitude: () => faker.location.longitude(),

  // Commerce
  product: () => faker.commerce.productName(),
  company: () => faker.company.name(),
  department: () => faker.commerce.department(),
  category: () => faker.commerce.department(),

  // IDs
  uuid: () => faker.string.uuid(),
  id: () => generateId(),

  // Enum
  enum: (opts) => {
    if (!opts?.values || !opts.values.length) return null;
    return faker.helpers.arrayElement(opts.values);
  },

  // Array
  array: (opts) => {
    const count = opts?.count || faker.number.int({ min: 1, max: 5 });
    const itemType = opts?.items || 'word';
    const generator = FIELD_GENERATORS[itemType];
    if (!generator) return [];
    return Array.from({ length: count }, () => generator(opts));
  },

  // Object (nested)
  object: (opts) => {
    if (!opts?.fields) return {};
    return generateRecord(opts.fields);
  },

  // Relation (foreign key) — handled separately by seeder
  relation: () => null,
};

/**
 * Generate a single field value from the schema definition
 */
export function generateFieldValue(fieldDef) {
  // If fieldDef is a string, treat it as the type
  const def = typeof fieldDef === 'string' ? { type: fieldDef } : fieldDef;
  const generator = FIELD_GENERATORS[def.type];

  if (!generator) {
    // Fallback: if type matches a faker method path like "lorem.sentence"
    return faker.lorem.word();
  }

  return generator(def);
}

/**
 * Generate a single record from a fields schema
 */
export function generateRecord(fields) {
  const record = {};
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    record[fieldName] = generateFieldValue(fieldDef);
  }
  return record;
}

/**
 * Seed a resource with realistic fake data
 */
export function seedResource(resourceName, schema, store, _allResources = {}) {
  const { fields, seed = 10 } = schema;
  if (!fields || seed <= 0) return;

  store.register(resourceName);

  const records = [];
  for (let i = 0; i < seed; i++) {
    const record = generateRecord(fields);
    records.push(record);
  }

  // Create all records first
  const createdRecords = store.createMany(resourceName, records);

  // Now resolve relations (foreign keys)
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const def = typeof fieldDef === 'string' ? { type: fieldDef } : fieldDef;
    if (def.type === 'relation' && def.resource) {
      const relatedRecords = store.findAll(def.resource);
      if (relatedRecords.length > 0) {
        for (const record of createdRecords) {
          const relatedRecord = faker.helpers.arrayElement(relatedRecords);
          store.patch(resourceName, record.id, { [fieldName]: relatedRecord.id });
        }
      }
    }
  }
}

/**
 * Seed all resources respecting dependency order
 */
export function seedAll(resources, store) {
  // First pass: find resources without relations (they get seeded first)
  const withRelations = [];
  const withoutRelations = [];

  for (const [name, schema] of Object.entries(resources)) {
    const fields = schema.fields || {};
    const hasRelation = Object.values(fields).some((f) => {
      const def = typeof f === 'string' ? { type: f } : f;
      return def.type === 'relation';
    });

    if (hasRelation) {
      withRelations.push([name, schema]);
    } else {
      withoutRelations.push([name, schema]);
    }
  }

  // Seed independent resources first
  for (const [name, schema] of withoutRelations) {
    seedResource(name, schema, store, resources);
  }

  // Then seed dependent resources
  for (const [name, schema] of withRelations) {
    seedResource(name, schema, store, resources);
  }
}
