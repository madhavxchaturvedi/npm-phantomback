/**
 * Default zero-config resources for PhantomBack
 * Used when no config file is found or --zero flag is used
 */
export const DEFAULT_RESOURCES = {
  users: {
    fields: {
      name: { type: 'name', required: true },
      email: { type: 'email', unique: true },
      username: { type: 'username' },
      avatar: { type: 'avatar' },
      bio: { type: 'bio' },
      age: { type: 'number', min: 18, max: 65 },
      role: { type: 'enum', values: ['admin', 'user', 'moderator'] },
      isActive: { type: 'boolean' },
    },
    seed: 25,
    auth: true,
  },
  posts: {
    fields: {
      title: { type: 'title', required: true },
      body: { type: 'paragraphs', count: 3 },
      slug: { type: 'slug' },
      image: { type: 'image' },
      published: { type: 'boolean' },
      views: { type: 'number', min: 0, max: 10000 },
      userId: { type: 'relation', resource: 'users' },
    },
    seed: 50,
  },
  comments: {
    fields: {
      body: { type: 'paragraph', required: true },
      rating: { type: 'rating' },
      userId: { type: 'relation', resource: 'users' },
      postId: { type: 'relation', resource: 'posts' },
    },
    seed: 100,
  },
  products: {
    fields: {
      name: { type: 'product', required: true },
      description: { type: 'description' },
      price: { type: 'price' },
      category: { type: 'category' },
      image: { type: 'image' },
      inStock: { type: 'boolean' },
      rating: { type: 'rating' },
    },
    seed: 30,
  },
  todos: {
    fields: {
      title: { type: 'sentence', required: true },
      completed: { type: 'boolean' },
      priority: { type: 'enum', values: ['low', 'medium', 'high'] },
      userId: { type: 'relation', resource: 'users' },
    },
    seed: 40,
  },
};
