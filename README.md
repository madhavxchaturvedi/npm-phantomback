<div align="center">

# 👻 PhantomBack

### Instant Fake Backend Generator with Smart Responses

[![npm version](https://img.shields.io/npm/v/phantomback.svg?style=flat-square&color=a78bfa)](https://www.npmjs.com/package/phantomback)
[![license](https://img.shields.io/npm/l/phantomback.svg?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/phantomback.svg?style=flat-square)](package.json)

**Stop waiting for the backend. Start building now.**

Drop in your API schema → get a fully functional REST server with realistic data,
JWT auth, pagination, filtering, sorting, search, and nested routes — in seconds.

[Getting Started](#-quick-start) · [Config Guide](#-configuration) · [API Reference](#-auto-generated-routes) · [Examples](#-real-world-examples)

</div>

---

## ✨ Features

- 🚀 **Zero-config mode** — one command, full working API
- 📦 **Auto CRUD** — GET, POST, PUT, PATCH, DELETE for every resource
- 🎭 **Realistic data** — powered by Faker.js (names, emails, prices, avatars...)
- 📄 **Pagination** — `?page=1&limit=10` with total counts & page metadata
- 🔍 **Search** — `?q=term` full-text search across all fields
- 🎯 **Filtering** — `?role=admin`, `?age_gte=18`, `?price_lte=100`, `?name_like=john`
- ↕️ **Sorting** — `?sort=-price`, `?sort=name,createdAt`
- 🔗 **Relations & Nested Routes** — `GET /users/:id/posts` auto-detected from foreign keys
- 🔒 **JWT Auth** — register, login, protected routes with Bearer tokens
- ⏱️ **Response Delay** — simulate slow networks with fixed or random latency
- ✅ **Validation** — required fields, type checks, unique constraints, email format
- 🖥️ **CLI + Library** — use as a CLI tool or import in your code
- 🧠 **Smart Defaults** — sensible conventions, override only what you need

---

## 📦 Installation

```bash
# Global install (recommended for CLI)
npm install -g phantomback

# Or as a dev dependency in your project
npm install --save-dev phantomback
```

---

## 🚀 Quick Start

### One command — full API:

```bash
phantomback start --zero
```

That's it. You now have a REST API running at `http://localhost:3777` with:
- 👤 25 Users (protected with auth)
- 📝 50 Posts
- 💬 100 Comments
- 📦 30 Products
- ✅ 40 Todos

### Or with your own config:

```bash
# Generate a starter config
phantomback init

# Edit phantom.config.js to your needs, then:
phantomback start
```

### Or as a library:

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
// server.getStore()  — export current state as JSON
```

One line for zero-config:

```js
import { createPhantomZero } from 'phantomback';
await createPhantomZero(); // Full demo API on port 3777
```

---

## ⚙️ Configuration

Create a `phantom.config.js` in your project root:

```js
export default {
  port: 3777,
  prefix: '/api',

  // Global response latency (ms)
  // latency: 500,
  // latency: [200, 800],  // random range

  auth: {
    secret: 'my-secret-key',
    expiresIn: '24h',
  },

  resources: {
    users: {
      fields: {
        name: { type: 'name', required: true },
        email: { type: 'email', unique: true },
        age: { type: 'number', min: 18, max: 65 },
        role: { type: 'enum', values: ['admin', 'user', 'moderator'] },
        avatar: { type: 'avatar' },
        isActive: { type: 'boolean' },
      },
      seed: 25,     // auto-generate 25 records
      auth: true,   // protect with JWT
    },

    posts: {
      fields: {
        title: { type: 'title', required: true },
        body: { type: 'paragraphs', count: 3 },
        userId: { type: 'relation', resource: 'users' },
        views: { type: 'number', min: 0, max: 10000 },
      },
      seed: 50,
    },
  },
};
```

### Supported Field Types

| Type | Generates | Options |
|------|-----------|---------|
| `name` | Full name | — |
| `firstName` | First name | — |
| `lastName` | Last name | — |
| `username` | Username | — |
| `email` | Email address | `unique: true` |
| `avatar` | Avatar URL | — |
| `phone` | Phone number | — |
| `bio` | Short bio | — |
| `jobTitle` | Job title | — |
| `sentence` | One sentence | — |
| `paragraph` | One paragraph | — |
| `paragraphs` | Multiple paragraphs | `count: 3` |
| `title` | Short title | — |
| `description` | 2-4 sentences | — |
| `slug` | URL slug | — |
| `number` | Integer | `min`, `max` |
| `float` | Decimal | `min`, `max`, `precision` |
| `price` | Price string | — |
| `rating` | 1.0 – 5.0 | — |
| `boolean` | true/false | — |
| `date` | ISO date | — |
| `pastDate` | Past date | — |
| `futureDate` | Future date | — |
| `url` | URL | — |
| `image` | Image URL | — |
| `color` | Color name | — |
| `address` | Street address | — |
| `city` | City name | — |
| `country` | Country name | — |
| `product` | Product name | — |
| `company` | Company name | — |
| `enum` | Random from list | `values: [...]` |
| `relation` | Foreign key | `resource: 'users'` |
| `uuid` | UUID string | — |

### Field Options

```js
{
  type: 'email',
  required: true,   // validation: must be present
  unique: true,     // validation: no duplicates
  min: 0,           // for numbers: minimum value
  max: 100,         // for numbers: maximum value
}
```

---

## 🛣️ Auto-Generated Routes

For each resource (e.g., `users`), PhantomBack generates:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all (paginated) |
| `GET` | `/api/users/:id` | Get one by ID |
| `POST` | `/api/users` | Create new |
| `PUT` | `/api/users/:id` | Full update |
| `PATCH` | `/api/users/:id` | Partial update |
| `DELETE` | `/api/users/:id` | Delete |

### Nested Routes (auto-detected from relations)

If `posts` has `userId: { type: 'relation', resource: 'users' }`, you get:

```
GET /api/users/:id/posts    → all posts by this user
```

### Special Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api` | List all endpoints |
| `GET` | `/api/_health` | Server health check |
| `POST` | `/api/auth/register` | Register (email + password) |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `GET` | `/api/auth/me` | Current user (requires token) |

---

## 🔍 Query Parameters

### Pagination

```bash
GET /api/users?page=2&limit=10
GET /api/users?offset=20&limit=10
```

Response includes:
```json
{
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

### Filtering

```bash
GET /api/users?role=admin              # exact match
GET /api/users?age_gte=18              # greater than or equal
GET /api/users?age_lte=30              # less than or equal
GET /api/users?age_gt=18               # greater than
GET /api/users?age_lt=30               # less than
GET /api/users?role_ne=admin           # not equal
GET /api/users?name_like=john          # contains (case-insensitive)
```

### Sorting

```bash
GET /api/users?sort=name               # ascending
GET /api/users?sort=-name              # descending
GET /api/users?sort=role,-age          # multi-field
```

### Search

```bash
GET /api/users?q=john                  # search across all fields
```

### Field Selection

```bash
GET /api/users?fields=name,email,role  # only return these fields
```

---

## 🔒 Authentication

1. **Register:**
```bash
curl -X POST http://localhost:3777/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123", "name": "John"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:3777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

3. **Access protected routes:**
```bash
curl http://localhost:3777/api/users \
  -H "Authorization: Bearer <your-token>"
```

---

## 💻 CLI Reference

```bash
# Start with auto-detected config file
phantomback start

# Start with zero-config (demo mode)
phantomback start --zero

# Custom port
phantomback start --port 4000

# Specific config file
phantomback start --config ./my-api.config.js

# Generate starter config
phantomback init

# Show help
phantomback --help
```

---

## 🏗️ Real-World Examples

### Hospital Management

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

### E-Commerce

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

---

## 📜 Response Format

All responses follow a consistent format:

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
  "error": {
    "status": 404,
    "message": "users with id \"abc\" not found"
  }
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "\"email\" is required" }
    ]
  }
}
```

---

## 🌟 Why PhantomBack?

| Problem | PhantomBack Solution |
|---------|---------------------|
| Backend not ready yet | Start frontend dev instantly |
| Static JSON mocks are unrealistic | Stateful CRUD with realistic Faker data |
| No pagination/filtering in mocks | Full query support out of the box |
| Auth testing is painful | JWT auth simulation built-in |
| Setting up mock servers takes time | One command / one line of code |
| Different projects need different schemas | Define any resource with a config file |

---

## 📄 License

MIT © [Madhav Chaturvedi](https://github.com/madhavchaturvedi)
