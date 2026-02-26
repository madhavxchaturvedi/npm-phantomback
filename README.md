<div align="center">

<br />

# 👻 PhantomBack

**Instant Fake Backend Generator with Smart Responses**

[![npm version](https://img.shields.io/npm/v/phantomback.svg?style=flat-square&color=a78bfa)](https://www.npmjs.com/package/phantomback)
[![downloads](https://img.shields.io/npm/dm/phantomback.svg?style=flat-square&color=a78bfa)](https://www.npmjs.com/package/phantomback)
[![license](https://img.shields.io/npm/l/phantomback.svg?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/phantomback.svg?style=flat-square)](package.json)

Stop waiting for the backend. Drop in your API schema → get a fully functional REST server with
realistic data, JWT auth, pagination, filtering, sorting, search, and nested routes — in seconds.

[Documentation](https://phantombackxdocs.vercel.app) ·
[Getting Started](https://phantombackxdocs.vercel.app/docs/getting-started) ·
[API Reference](https://phantombackxdocs.vercel.app/docs/api-reference) ·
[Playground](https://phantombackxdocs.vercel.app/docs/playground) ·
[GitHub](https://github.com/madhavxchaturvedi/npm-phantomback)

<br />

</div>

---

## Why PhantomBack?

| Pain point | PhantomBack fix |
|---|---|
| Backend not ready yet | Full REST API in one command |
| Static JSON mocks feel fake | Stateful CRUD with realistic Faker data |
| No pagination / filtering in mocks | Full query support out of the box |
| Auth testing is painful | JWT auth simulation built-in |
| Mock server setup takes time | One command or one line of code |

---

## Quick Start

### Install

```bash
npm install -g phantomback        # CLI (global)
npm install --save-dev phantomback # Library (project)
```

### Zero-config — one command, full API

```bash
phantomback start --zero
```

You now have a REST API at **`http://localhost:3777`** with:

| Resource | Count | Auth |
|---|---|---|
| `/api/users` | 25 records | 🔒 Protected |
| `/api/posts` | 50 records | — |
| `/api/comments` | 100 records | — |
| `/api/products` | 30 records | — |
| `/api/todos` | 40 records | — |

### Or bring your own schema

```bash
phantomback init          # generates phantom.config.js
phantomback start         # reads config and starts server
```

### Or use as a library

```js
import { createPhantom } from 'phantomback';

const server = await createPhantom({
  port: 3777,
  resources: {
    users: {
      fields: {
        name: { type: 'name', required: true },
        email: { type: 'email', unique: true },
        role: { type: 'enum', values: ['admin', 'user'] },
      },
      seed: 25,
    },
  },
});

// server.stop()      — shut down
// server.reset()     — re-seed all data
// server.getStore()  — export current state
```

One-liner for zero-config:

```js
import { createPhantomZero } from 'phantomback';
await createPhantomZero(); // Full demo API on port 3777
```

---

## Configuration

Create **`phantom.config.js`** in your project root:

```js
export default {
  port: 3777,
  prefix: '/api',
  // latency: 500,          // fixed delay (ms)
  // latency: [200, 800],   // random range

  auth: {
    secret: 'my-secret-key',
    expiresIn: '24h',
  },

  resources: {
    users: {
      fields: {
        name:     { type: 'name', required: true },
        email:    { type: 'email', unique: true },
        age:      { type: 'number', min: 18, max: 65 },
        role:     { type: 'enum', values: ['admin', 'user', 'moderator'] },
        avatar:   { type: 'avatar' },
        isActive: { type: 'boolean' },
      },
      seed: 25,
      auth: true,   // protect with JWT
    },

    posts: {
      fields: {
        title:  { type: 'title', required: true },
        body:   { type: 'paragraphs', count: 3 },
        userId: { type: 'relation', resource: 'users' },
        views:  { type: 'number', min: 0, max: 10000 },
      },
      seed: 50,
    },
  },
};
```

> **Full config reference →** [phantombackxdocs.vercel.app/docs/configuration](https://phantombackxdocs.vercel.app/docs/configuration)

---

## Supported Field Types

| Type | Generates | Options |
|---|---|---|
| `name` `firstName` `lastName` `username` | Names | — |
| `email` | Email | `unique` |
| `phone` | Phone number | — |
| `avatar` | Avatar URL | — |
| `bio` `jobTitle` | Profile text | — |
| `sentence` `paragraph` `paragraphs` | Text blocks | `count` |
| `title` `description` `slug` | Content | — |
| `number` `float` `price` `rating` | Numbers | `min` `max` `precision` |
| `boolean` | true / false | — |
| `date` `pastDate` `futureDate` | ISO dates | — |
| `url` `image` `color` | Misc | — |
| `address` `city` `country` | Location | — |
| `product` `company` | Business | — |
| `enum` | Random from list | `values: [...]` |
| `relation` | Foreign key | `resource: '...'` |
| `uuid` | UUID string | — |

### Field Options

```js
{
  type: 'email',
  required: true,   // must be present on create
  unique: true,     // no duplicates allowed
  min: 0,           // number minimum
  max: 100,         // number maximum
}
```

---

## Auto-Generated Routes

Every resource gets full CRUD automatically:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all (paginated) |
| `GET` | `/api/users/:id` | Get one |
| `POST` | `/api/users` | Create |
| `PUT` | `/api/users/:id` | Full update |
| `PATCH` | `/api/users/:id` | Partial update |
| `DELETE` | `/api/users/:id` | Delete |

### Nested Routes

If `posts` has `userId: { type: 'relation', resource: 'users' }`, you automatically get:

```
GET /api/users/:id/posts   → all posts by this user
```

### Special Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api` | List all endpoints |
| `GET` | `/api/_health` | Health check |
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/auth/me` | Current user (token required) |

---

## Query Parameters

```bash
# Pagination
GET /api/users?page=2&limit=10
GET /api/users?offset=20&limit=10

# Filtering
GET /api/users?role=admin                # exact match
GET /api/users?age_gte=18                # ≥
GET /api/users?age_lte=30                # ≤
GET /api/users?age_gt=18&age_lt=30       # range
GET /api/users?role_ne=admin             # not equal
GET /api/users?name_like=john            # contains

# Sorting
GET /api/users?sort=name                 # ascending
GET /api/users?sort=-name                # descending
GET /api/users?sort=role,-age            # multi-field

# Search
GET /api/users?q=john                    # full-text across all fields

# Field Selection
GET /api/users?fields=name,email,role
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Authentication

```bash
# 1. Register
curl -X POST http://localhost:3777/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "secret123", "name": "John"}'

# 2. Login
curl -X POST http://localhost:3777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "secret123"}'

# 3. Use the token
curl http://localhost:3777/api/users \
  -H "Authorization: Bearer <your-token>"
```

---

## CLI Reference

```bash
phantomback start              # start with phantom.config.js
phantomback start --zero       # zero-config demo mode
phantomback start --port 4000  # custom port
phantomback start --config ./my-api.config.js
phantomback init               # generate starter config
phantomback --help
```

> **Full CLI docs →** [phantombackxdocs.vercel.app/docs/cli](https://phantombackxdocs.vercel.app/docs/cli)

---

## Real-World Examples

<details>
<summary><strong>🏥 Hospital Management</strong></summary>

```js
export default {
  resources: {
    doctors: {
      fields: {
        name: { type: 'name', required: true },
        specialization: { type: 'enum', values: ['Cardiology', 'Neurology', 'Orthopedics'] },
        experience: { type: 'number', min: 1, max: 30 },
        available: { type: 'boolean' },
      },
      seed: 15,
    },
    patients: {
      fields: {
        name: { type: 'name', required: true },
        age: { type: 'number', min: 1, max: 100 },
        bloodGroup: { type: 'enum', values: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-'] },
        doctorId: { type: 'relation', resource: 'doctors' },
      },
      seed: 40,
    },
  },
};
```
</details>

<details>
<summary><strong>🛒 E-Commerce</strong></summary>

```js
export default {
  resources: {
    products: {
      fields: {
        name: { type: 'product', required: true },
        price: { type: 'price' },
        category: { type: 'enum', values: ['Electronics', 'Clothing', 'Books', 'Food'] },
        inStock: { type: 'boolean' },
        rating: { type: 'rating' },
      },
      seed: 100,
    },
    orders: {
      fields: {
        customerName: { type: 'name' },
        total: { type: 'number', min: 10, max: 5000 },
        status: { type: 'enum', values: ['pending', 'processing', 'shipped', 'delivered'] },
      },
      seed: 50,
    },
  },
};
```
</details>

> **More examples →** [phantombackxdocs.vercel.app/docs/examples](https://phantombackxdocs.vercel.app/docs/examples)

---

## Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

**Error:**
```json
{
  "success": false,
  "error": { "status": 404, "message": "users with id \"abc\" not found" }
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "\"email\" is required" }]
  }
}
```

---

## License

MIT © [Madhav Chaturvedi](https://github.com/madhavxchaturvedi)

---

<div align="center">

[Documentation](https://phantombackxdocs.vercel.app) ·
[npm](https://www.npmjs.com/package/phantomback) ·
[GitHub](https://github.com/madhavxchaturvedi/npm-phantomback) ·
[CLI Reference](https://phantombackxdocs.vercel.app/docs/cli) ·
[Playground](https://phantombackxdocs.vercel.app/docs/playground)

Made with ❤️ by [Madhav Chaturvedi](https://madhavxchaturvedi.vercel.app) · [LinkedIn](https://www.linkedin.com/in/madhavxchaturvedi/) · [Instagram](https://www.instagram.com/madhavxchaturvedi)

</div>
