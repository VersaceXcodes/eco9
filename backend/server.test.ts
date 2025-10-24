import { app, pool } from './server';
import supertest from 'supertest';
import { z } from 'zod';

const request = supertest(app);

// Mock JWT token for protected routes
const mockToken = 'mock-jwt-token';

describe('eco9 Backend Tests', () => {
  beforeAll(async () => {
    // Initialize test database connection
    await pool.connect();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    // Start transaction for each test
    const client = await pool.connect();
    jest.doMock('pg', () => ({
      Pool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(client),
        end: jest.fn()
      }))
    }));
  });

  afterEach(async () => {
    // Rollback transaction after each test
    await client.query('ROLLBACK');
  });

  describe('User Management', () => {
    test('should register new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        full_name: 'Test User'
      };

      const res = await request
       .post('/api/auth/register')
       .send(userData)
       .expect(201);

      expect(res.body.user).toHaveProperty('id');
      expect(res.body).toHaveProperty('auth_token');
      expect(res.body.user.username).toBe(userData.username);
    });

    test('should fail registration with duplicate email', async () => {
      const existingUser = {
        username: 'existinguser',
        email: 'existing@example.com',
        password_hash: 'password123'
      };

      // First registration
      await request.post('/api/auth/register').send(existingUser).expect(201);

      // Second attempt with same email
      await request
       .post('/api/auth/register')
       .send({...existingUser, username: 'anotheruser' })
       .expect(409);
    });
  });

  describe('Activity Endpoints', () => {
    test('should create activity with valid data', async () => {
      // Authenticate first
      const authRes = await request
       .post('/api/auth/login')
       .send({ email: 'test@example.com', password_hash: 'password123' })
       .expect(200);

      const activityData = {
        category: 'Transport',
        value: 5,
        unit: 'miles'
      };

      const res = await request
       .post('/api/activities')
       .set("Authorization", `Bearer ${authRes.body.auth_token}`)
       .send(activityData)
       .expect(201);

      expect(res.body).toHaveProperty('impact');
      expect(res.body.impact.co2_saved).toBeGreaterThan(0);
    });

    test('should fail activity creation with invalid category', async () => {
      const authRes = await request
       .post('/api/auth/login')
       .send({ email: 'test@example.com', password_hash: 'password123' })
       .expect(200);

      const invalidActivity = {
        category: 'InvalidCategory',
        value: 5,
        unit: 'miles'
      };

      await request
       .post('/api/activities')
       .set("Authorization", `Bearer ${authRes.body.auth_token}`)
       .send(invalidActivity)
       .expect(400);
    });
  });

  describe('Database Operations', () => {
    test('should maintain like constraints', async () => {
      const userId = 'test-user-123';
      const postId = 'test-post-123';
      const commentId = 'test-comment-123';

      // Try to like both post and comment simultaneously
      const invalidLike = {
        user_id: userId,
        post_id: postId,
        comment_id: commentId
      };

      const res = await request
       .post('/api/likes')
       .set("Authorization", `Bearer ${mockToken}`)
       .send(invalidLike)
       .expect(400);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('Authentication', () => {
    test('should fail login with invalid credentials', async () => {
      await request
       .post('/api/auth/login')
       .send({ email: 'invalid@example.com', password_hash: 'wrongpassword' })
       .expect(401);
    });

    test('should deny access to protected routes without token', async () => {
      await request.get('/api/activities').expect(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JWT', async () => {
      await request
       .get('/api/activities')
       .set("Authorization", 'Bearer invalid-token')
       .expect(401);
    });

    test('should handle missing required fields', async () => {
      const authRes = await request
       .post('/api/auth/login')
       .send({ email: 'test@example.com', password_hash: 'password123' })
       .expect(200);

      const incompleteActivity = {
        category: 'Transport',
        // Missing value and unit
      };

      await request
       .post('/api/activities')
       .set("Authorization", `Bearer ${authRes.body.auth_token}`)
       .send(incompleteActivity)
       .expect(400);
    });
  });

  describe('Schema Validation', () => {
    test('should validate user creation schema', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123'
      };

      const result = zodUserCreateSchema.parse(validUser);
      expect(result).toEqual(validUser);

      const invalidUser = {...validUser, email: 'invalid-email' };
      expect(() => zodUserCreateSchema.parse(invalidUser)).toThrow();
    });
  });
});