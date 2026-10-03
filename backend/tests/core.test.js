import { describe, it, expect, vi } from 'vitest';
import { protectRoute } from '../src/middleware/auth.middleware.js';
import User from '../src/models/user.model.js';
import jwt from 'jsonwebtoken';

vi.mock('../src/models/user.model.js');
vi.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  it('should return 401 if no token is provided', async () => {
    const req = { cookies: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await protectRoute(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized - No Token Provided" });
  });

  it('should return 401 if token is expired', async () => {
    const req = { cookies: { jwt: 'expired_token' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    jwt.verify.mockImplementation(() => {
      const error = new Error("jwt expired");
      error.name = "TokenExpiredError";
      throw error;
    });

    await protectRoute(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized - Token Expired" });
  });

  it('should call next() if valid token and user exists', async () => {
    const req = { cookies: { jwt: 'valid_token' } };
    const res = {};
    const next = vi.fn();

    jwt.verify.mockReturnValue({ userId: 'valid_user_id' });
    
    // Mock User.findById(...).select(...)
    const mockSelect = vi.fn().mockResolvedValue({ _id: 'valid_user_id', fullName: 'Test User' });
    User.findById.mockReturnValue({ select: mockSelect });

    await protectRoute(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.fullName).toBe('Test User');
  });
});
