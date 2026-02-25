import jwt from 'jsonwebtoken';
import { sendError, sendResponse, asyncHandler } from '../utils/helpers.js';

const DEFAULT_SECRET = 'phantomback-secret-key';
const DEFAULT_EXPIRES_IN = '24h';

/**
 * Create auth routes (login, register)
 */
export function createAuthRoutes(router, store, config) {
  const secret = config.auth?.secret || DEFAULT_SECRET;
  const expiresIn = config.auth?.expiresIn || DEFAULT_EXPIRES_IN;

  // POST /api/auth/register
  router.post(
    `${config.prefix}/auth/register`,
    asyncHandler(async (req, res) => {
      const { email, password, ...rest } = req.body;

      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
      }

      // Check if user already exists
      const existing = store.findAll('users').find((u) => u.email === email);

      if (existing) {
        return sendError(res, 409, 'User with this email already exists');
      }

      // Create user (password is stored but this is a fake backend)
      const user = store.create('users', {
        email,
        password, // In a real app, this would be hashed
        ...rest,
      });

      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn });

      return sendResponse(res, 201, {
        user: { ...user, password: undefined },
        token,
      });
    }),
  );

  // POST /api/auth/login
  router.post(
    `${config.prefix}/auth/login`,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      if (!email) {
        return sendError(res, 400, 'Email is required');
      }

      // Find user by email
      const user = store.findAll('users').find((u) => u.email === email);

      if (!user) {
        return sendError(res, 401, 'Invalid credentials');
      }

      // In phantom mode, any password works if user exists
      // But if a password was set during registration, check it
      if (user.password && password && user.password !== password) {
        return sendError(res, 401, 'Invalid credentials');
      }

      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn });

      return sendResponse(res, 200, {
        user: { ...user, password: undefined },
        token,
      });
    }),
  );

  // GET /api/auth/me — get current user from token
  router.get(
    `${config.prefix}/auth/me`,
    authMiddleware(secret),
    asyncHandler(async (req, res) => {
      const user = store.findById('users', req.user.id);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }
      return sendResponse(res, 200, { ...user, password: undefined });
    }),
  );
}

/**
 * Auth middleware — verifies JWT token
 */
export function authMiddleware(secret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendError(res, 401, 'Authorization header is required. Use: Bearer <token>');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendError(res, 401, 'Invalid authorization format. Use: Bearer <token>');
    }

    const token = parts[1];

    try {
      const secret_key = secret || DEFAULT_SECRET;
      const decoded = jwt.verify(token, secret_key);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token has expired');
      }
      return sendError(res, 401, 'Invalid token');
    }
  };
}
