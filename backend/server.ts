import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

// Import Zod schemas
import { 
  userEntitySchema, 
  createUserInputSchema, 
  updateUserInputSchema,
  searchUserInputSchema 
} from './schema.ts';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const { 
  DATABASE_URL, 
  PGHOST, 
  PGDATABASE, 
  PGUSER, 
  PGPASSWORD, 
  PGPORT = 5432,
  JWT_SECRET = 'eco9-jwt-secret-key',
  PORT = 3000 
} = process.env;

// PostgreSQL connection
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create storage directory if it doesn't exist
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

/*
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, username, email, full_name, profile_image_url, created_at FROM users WHERE id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_USER_NOT_FOUND'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
 * Activity Impact Calculator
 * Calculates environmental impact based on activity category and value
 * Uses predefined multipliers for different activity types
 */
function calculateImpact(category, value, unit) {
  // Impact multipliers (mock data - in real app would come from database)
  const impactMultipliers = {
    transport: {
      biking: { co2_per_mile: 0.4, water_per_mile: 0.1 },
      walking: { co2_per_mile: 0.3, water_per_mile: 0.05 },
      public_transport: { co2_per_mile: 0.2, water_per_mile: 0.08 }
    },
    energy: {
      solar: { co2_per_kwh: 2.5, water_per_kwh: 0.5 },
      led_bulbs: { co2_per_hour: 0.1, water_per_hour: 0.02 }
    },
    waste: {
      recycling: { co2_per_kg: 1.8, water_per_kg: 0.3 },
      composting: { co2_per_kg: 2.1, water_per_kg: 0.4 }
    }
  };

  // Default impact values
  let co2_saved = value * 0.5; // Default multiplier
  let water_conserved = value * 0.1; // Default multiplier

  // Calculate specific impact based on category
  if (impactMultipliers[category]) {
    const categoryData = impactMultipliers[category];
    const firstKey = Object.keys(categoryData)[0];
    if (categoryData[firstKey]) {
      co2_saved = value * (categoryData[firstKey].co2_per_mile || categoryData[firstKey].co2_per_kwh || categoryData[firstKey].co2_per_kg || 0.5);
      water_conserved = value * (categoryData[firstKey].water_per_mile || categoryData[firstKey].water_per_kwh || categoryData[firstKey].water_per_kg || 0.1);
    }
  }

  return {
    co2_saved: Math.round(co2_saved * 100) / 100,
    water_conserved: Math.round(water_conserved * 100) / 100
  };
}

// Authentication Routes

/*
 * User Registration Endpoint
 * Creates new user account with username, email, password
 * Returns user data and JWT token for immediate login
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    const { username, email, password_hash, full_name, profile_image_url } = validatedData;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email or username already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user (NO HASHING - store password directly for development)
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name, profile_image_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, profile_image_url, created_at',
      [username, email.toLowerCase().trim(), password_hash, full_name, profile_image_url]
    );

    const user = result.rows[0];

    // Generate JWT token
    const auth_token = jwt.sign(
      { user_id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_image_url: user.profile_image_url
      },
      auth_token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * User Login Endpoint
 * Authenticates user with email and password
 * Returns user data and JWT token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    if (!email || !password_hash) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Find user (NO HASHING - direct password comparison for development)
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Check password (direct comparison for development)
    if (password_hash !== user.password_hash) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT token
    const auth_token = jwt.sign(
      { user_id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_image_url: user.profile_image_url
      },
      auth_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// User Management Routes

/*
 * Get User Profile
 * Returns user profile data for the specified user ID
 */
app.get('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const result = await pool.query('SELECT id, username, email, full_name, profile_image_url, created_at FROM users WHERE id = $1', [user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const user = result.rows[0];
    res.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      profile_image_url: user.profile_image_url
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update User Profile
 * Updates user profile information
 */
app.put('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check if user is updating their own profile
    if (req.user.id.toString() !== user_id) {
      return res.status(403).json(createErrorResponse('Forbidden: Can only update own profile', null, 'FORBIDDEN'));
    }

    const validatedData = updateUserInputSchema.parse({ id: user_id, ...req.body });
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      updateValues.push(validatedData.username);
    }
    if (validatedData.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(validatedData.email.toLowerCase().trim());
    }
    if (validatedData.full_name !== undefined) {
      updateFields.push(`full_name = $${paramCount++}`);
      updateValues.push(validatedData.full_name);
    }
    if (validatedData.profile_image_url !== undefined) {
      updateFields.push(`profile_image_url = $${paramCount++}`);
      updateValues.push(validatedData.profile_image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    updateValues.push(user_id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, full_name, profile_image_url, created_at`;

    const result = await pool.query(query, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const user = result.rows[0];
    res.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      profile_image_url: user.profile_image_url
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Delete User Account
 * Removes user account and all associated data
 */
app.delete('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check if user is deleting their own account
    if (req.user.id.toString() !== user_id) {
      return res.status(403).json(createErrorResponse('Forbidden: Can only delete own account', null, 'FORBIDDEN'));
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Activity Management Routes

/*
 * List User Activities
 * Returns paginated list of user's logged activities with impact calculations
 * Note: Since activities table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, sort_by = 'timestamp', sort_order = 'desc', category } = req.query;

    // Mock activities data since activities table doesn't exist in provided schema
    const mockActivities = [
      {
        id: '1',
        user_id: req.user.id.toString(),
        category: 'transport',
        value: 5.2,
        unit: 'miles',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        impact: calculateImpact('transport', 5.2, 'miles')
      },
      {
        id: '2',
        user_id: req.user.id.toString(),
        category: 'energy',
        value: 3.5,
        unit: 'kwh',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        impact: calculateImpact('energy', 3.5, 'kwh')
      },
      {
        id: '3',
        user_id: req.user.id.toString(),
        category: 'waste',
        value: 2.1,
        unit: 'kg',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        impact: calculateImpact('waste', 2.1, 'kg')
      }
    ];

    // Apply filters
    let filteredActivities = mockActivities;
    if (category) {
      filteredActivities = filteredActivities.filter(activity => activity.category === category);
    }

    // Apply sorting
    filteredActivities.sort((a, b) => {
      let aValue = a[sort_by];
      let bValue = b[sort_by];
      
      if (sort_by === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(Number(offset), Number(offset) + Number(limit));

    res.json(paginatedActivities);
  } catch (error) {
    console.error('List activities error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create New Activity
 * Logs a new eco-friendly activity and calculates environmental impact
 * Note: Since activities table doesn't exist in provided DB schema, returning mock response
 */
app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { category, value, unit, timestamp, notes } = req.body;

    if (!category || !value || !unit) {
      return res.status(400).json(createErrorResponse('Category, value, and unit are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Calculate environmental impact
    const impact = calculateImpact(category, value, unit);

    // Mock activity creation since activities table doesn't exist
    const newActivity = {
      id: uuidv4(),
      user_id: req.user.id.toString(),
      category,
      value: Number(value),
      unit,
      timestamp: timestamp || new Date().toISOString(),
      impact
    };

    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Specific Activity
 * Returns details of a specific activity by ID
 * Note: Since activities table doesn't exist in provided DB schema, returning mock response
 */
app.get('/api/activities/:activity_id', authenticateToken, async (req, res) => {
  try {
    const { activity_id } = req.params;

    // Mock activity data
    const mockActivity = {
      id: activity_id,
      user_id: req.user.id.toString(),
      category: 'transport',
      value: 5.2,
      unit: 'miles',
      timestamp: new Date().toISOString(),
      impact: calculateImpact('transport', 5.2, 'miles')
    };

    res.json(mockActivity);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Activity
 * Updates an existing activity record
 * Note: Since activities table doesn't exist in provided DB schema, returning mock response
 */
app.put('/api/activities/:activity_id', authenticateToken, async (req, res) => {
  try {
    const { activity_id } = req.params;
    const { category, value, unit, timestamp, notes } = req.body;

    // Mock updated activity
    const updatedActivity = {
      id: activity_id,
      user_id: req.user.id.toString(),
      category: category || 'transport',
      value: value ? Number(value) : 5.2,
      unit: unit || 'miles',
      timestamp: timestamp || new Date().toISOString(),
      impact: calculateImpact(category || 'transport', value || 5.2, unit || 'miles')
    };

    res.json(updatedActivity);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Delete Activity
 * Removes an activity record
 * Note: Since activities table doesn't exist in provided DB schema, returning success response
 */
app.delete('/api/activities/:activity_id', authenticateToken, async (req, res) => {
  try {
    const { activity_id } = req.params;
    
    // Mock deletion - in real implementation would delete from activities table
    res.status(204).send();
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Impact Dashboard Route

/*
 * Get User Impact Metrics
 * Returns aggregated environmental impact data with historical trends
 * Note: Since impact tracking tables don't exist in provided DB schema, returning mock data
 */
app.get('/api/impact', authenticateToken, async (req, res) => {
  try {
    const { range = 'monthly' } = req.query;

    // Mock impact data with realistic numbers
    const mockImpactData = {
      co2_saved: 45.8,
      water_conserved: 12.3,
      waste_diverted: 8.7,
      trees_saved: 0.3,
      historical_data: [
        { date: '2024-01-01', co2_saved: 12.5, water_conserved: 3.2 },
        { date: '2024-01-02', co2_saved: 8.3, water_conserved: 2.1 },
        { date: '2024-01-03', co2_saved: 15.2, water_conserved: 4.8 },
        { date: '2024-01-04', co2_saved: 9.8, water_conserved: 2.2 }
      ]
    };

    // Adjust historical data based on range
    if (range === 'daily') {
      mockImpactData.historical_data = mockImpactData.historical_data.slice(-7);
    } else if (range === 'weekly') {
      mockImpactData.historical_data = mockImpactData.historical_data.slice(-4);
    }

    res.json(mockImpactData);
  } catch (error) {
    console.error('Get impact error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Goal Management Routes

/*
 * List User Goals
 * Returns paginated list of user's sustainability goals
 * Note: Since goals table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    // Mock goals data
    const mockGoals = [
      {
        id: '1',
        user_id: req.user.id.toString(),
        title: 'Bike 100 miles this month',
        target_value: 100,
        target_unit: 'miles',
        deadline: '2024-02-29',
        progress: 67.5,
        created_at: new Date(Date.now() - 864000000).toISOString()
      },
      {
        id: '2',
        user_id: req.user.id.toString(),
        title: 'Reduce energy consumption by 20%',
        target_value: 20,
        target_unit: 'percent',
        deadline: '2024-03-31',
        progress: 45.2,
        created_at: new Date(Date.now() - 432000000).toISOString()
      }
    ];

    // Apply pagination
    const paginatedGoals = mockGoals.slice(Number(offset), Number(offset) + Number(limit));

    res.json(paginatedGoals);
  } catch (error) {
    console.error('List goals error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create New Goal
 * Creates a new sustainability goal for the user
 * Note: Since goals table doesn't exist in provided DB schema, returning mock response
 */
app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { title, target_value, target_unit, deadline } = req.body;

    if (!title || !target_value || !target_unit) {
      return res.status(400).json(createErrorResponse('Title, target_value, and target_unit are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Mock goal creation
    const newGoal = {
      id: uuidv4(),
      user_id: req.user.id.toString(),
      title,
      target_value: Number(target_value),
      target_unit,
      deadline: deadline || null,
      progress: 0,
      created_at: new Date().toISOString()
    };

    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Specific Goal
 * Returns details of a specific goal by ID
 * Note: Since goals table doesn't exist in provided DB schema, returning mock response
 */
app.get('/api/goals/:goal_id', authenticateToken, async (req, res) => {
  try {
    const { goal_id } = req.params;

    // Mock goal data
    const mockGoal = {
      id: goal_id,
      user_id: req.user.id.toString(),
      title: 'Bike 100 miles this month',
      target_value: 100,
      target_unit: 'miles',
      deadline: '2024-02-29',
      progress: 67.5,
      created_at: new Date().toISOString()
    };

    res.json(mockGoal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Goal
 * Updates an existing goal
 * Note: Since goals table doesn't exist in provided DB schema, returning mock response
 */
app.put('/api/goals/:goal_id', authenticateToken, async (req, res) => {
  try {
    const { goal_id } = req.params;
    const { title, target_value, target_unit, deadline } = req.body;

    // Mock updated goal
    const updatedGoal = {
      id: goal_id,
      user_id: req.user.id.toString(),
      title: title || 'Updated Goal',
      target_value: target_value ? Number(target_value) : 100,
      target_unit: target_unit || 'units',
      deadline: deadline || '2024-12-31',
      progress: 67.5,
      created_at: new Date().toISOString()
    };

    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Delete Goal
 * Removes a goal
 * Note: Since goals table doesn't exist in provided DB schema, returning success response
 */
app.delete('/api/goals/:goal_id', authenticateToken, async (req, res) => {
  try {
    const { goal_id } = req.params;
    
    // Mock deletion
    res.status(204).send();
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Challenge Management Routes

/*
 * List Available Challenges
 * Returns paginated list of community challenges with filtering options
 * Note: Since challenges table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, sort_by = 'start_date', sort_order = 'desc', challenge_type, duration } = req.query;

    // Mock challenges data
    const mockChallenges = [
      {
        id: '1',
        title: 'Plastic-Free February',
        description: 'Eliminate single-use plastics for the entire month',
        start_date: '2024-02-01',
        end_date: '2024-02-29',
        participants: [
          { id: '1', username: 'eco_warrior', email: 'eco@example.com', full_name: 'Eco Warrior', profile_image_url: 'https://picsum.photos/seed/eco1/200/300' },
          { id: '2', username: 'green_living', email: 'green@example.com', full_name: 'Green Living', profile_image_url: 'https://picsum.photos/seed/green2/200/300' }
        ]
      },
      {
        id: '2',
        title: '30-Day Bike Challenge',
        description: 'Bike to work every day for 30 days',
        start_date: '2024-01-15',
        end_date: '2024-02-15',
        participants: [
          { id: '3', username: 'bike_commuter', email: 'bike@example.com', full_name: 'Bike Commuter', profile_image_url: 'https://picsum.photos/seed/bike3/200/300' }
        ]
      }
    ];

    // Apply filters
    let filteredChallenges = mockChallenges;
    if (challenge_type) {
      // In real implementation, would filter by challenge_type
    }
    if (duration) {
      // In real implementation, would filter by duration
    }

    // Apply pagination
    const paginatedChallenges = filteredChallenges.slice(Number(offset), Number(offset) + Number(limit));

    res.json(paginatedChallenges);
  } catch (error) {
    console.error('List challenges error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create New Challenge
 * Creates a new community challenge
 * Note: Since challenges table doesn't exist in provided DB schema, returning mock response
 */
app.post('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const { title, description, start_date, end_date, challenge_type } = req.body;

    if (!title || !description || !start_date || !end_date) {
      return res.status(400).json(createErrorResponse('Title, description, start_date, and end_date are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Mock challenge creation
    const newChallenge = {
      id: uuidv4(),
      title,
      description,
      start_date,
      end_date,
      participants: []
    };

    res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Challenge Details
 * Returns details of a specific challenge
 * Note: Since challenges table doesn't exist in provided DB schema, returning mock response
 */
app.get('/api/challenges/:challenge_id', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.params;

    // Mock challenge data
    const mockChallenge = {
      id: challenge_id,
      title: 'Plastic-Free February',
      description: 'Eliminate single-use plastics for the entire month',
      start_date: '2024-02-01',
      end_date: '2024-02-29',
      participants: [
        { id: '1', username: 'eco_warrior', email: 'eco@example.com', full_name: 'Eco Warrior', profile_image_url: 'https://picsum.photos/seed/eco1/200/300' }
      ]
    };

    res.json(mockChallenge);
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Challenge
 * Updates an existing challenge
 * Note: Since challenges table doesn't exist in provided DB schema, returning mock response
 */
app.put('/api/challenges/:challenge_id', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.params;
    const { title, description, start_date, end_date } = req.body;

    // Mock updated challenge
    const updatedChallenge = {
      id: challenge_id,
      title: title || 'Updated Challenge',
      description: description || 'Updated description',
      start_date: start_date || '2024-01-01',
      end_date: end_date || '2024-12-31',
      participants: []
    };

    res.json(updatedChallenge);
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Delete Challenge
 * Removes a challenge
 * Note: Since challenges table doesn't exist in provided DB schema, returning success response
 */
app.delete('/api/challenges/:challenge_id', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.params;
    
    // Mock deletion
    res.status(204).send();
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Join Challenge
 * Adds user to a challenge's participant list
 * Note: Since challenges table doesn't exist in provided DB schema, returning mock response
 */
app.post('/api/challenges/:challenge_id', authenticateToken, async (req, res) => {
  try {
    const { challenge_id } = req.params;

    // Mock challenge with user added as participant
    const challengeWithParticipant = {
      id: challenge_id,
      title: 'Plastic-Free February',
      description: 'Eliminate single-use plastics for the entire month',
      start_date: '2024-02-01',
      end_date: '2024-02-29',
      participants: [
        { 
          id: req.user.id.toString(),
          username: req.user.username,
          email: req.user.email,
          full_name: req.user.full_name,
          profile_image_url: req.user.profile_image_url
        }
      ]
    };

    res.json(challengeWithParticipant);
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Educational Content Routes

/*
 * List Educational Content
 * Returns paginated list of educational resources with filtering
 * Note: Since educational_content table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/educational_contents', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, sort_by = 'title', sort_order = 'asc', category } = req.query;

    // Mock educational content data
    const mockContent = [
      {
        id: '1',
        title: 'Composting 101: Getting Started',
        content_type: 'article',
        category: 'waste',
        content: 'Learn the basics of home composting to reduce your waste footprint...',
        media_url: 'https://picsum.photos/seed/compost/800/600'
      },
      {
        id: '2',
        title: 'Sustainable Transportation Options',
        content_type: 'video',
        category: 'transport',
        content: 'Explore eco-friendly ways to get around your city...',
        media_url: 'https://picsum.photos/seed/transport/800/600'
      },
      {
        id: '3',
        title: 'Energy Efficiency at Home',
        content_type: 'course',
        category: 'energy',
        content: 'A comprehensive guide to reducing your home energy consumption...',
        media_url: 'https://picsum.photos/seed/energy/800/600'
      }
    ];

    // Apply filters
    let filteredContent = mockContent;
    if (category) {
      filteredContent = filteredContent.filter(content => content.category === category);
    }

    // Apply pagination
    const paginatedContent = filteredContent.slice(Number(offset), Number(offset) + Number(limit));

    res.json(paginatedContent);
  } catch (error) {
    console.error('List educational content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Specific Educational Content
 * Returns details of specific educational content
 * Note: Since educational_content table doesn't exist in provided DB schema, returning mock response
 */
app.get('/api/educational_contents/:content_id', authenticateToken, async (req, res) => {
  try {
    const { content_id } = req.params;

    // Mock educational content
    const mockContent = {
      id: content_id,
      title: 'Composting 101: Getting Started',
      content_type: 'article',
      category: 'waste',
      content: 'Learn the basics of home composting to reduce your waste footprint. This comprehensive guide covers everything from choosing the right bin to maintaining proper moisture levels...',
      media_url: 'https://picsum.photos/seed/compost/800/600'
    };

    res.json(mockContent);
  } catch (error) {
    console.error('Get educational content error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Rewards System Routes

/*
 * List Available Rewards
 * Returns paginated list of rewards available for redemption
 * Note: Since rewards table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/rewards', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, sort_by = 'point_cost', sort_order = 'asc' } = req.query;

    // Mock rewards data
    const mockRewards = [
      {
        id: '1',
        title: '10% Off Eco-Friendly Products',
        point_cost: 500,
        description: 'Get 10% discount on sustainable products from our partner store'
      },
      {
        id: '2',
        title: 'Reusable Water Bottle',
        point_cost: 1000,
        description: 'High-quality stainless steel water bottle with eco9 branding'
      },
      {
        id: '3',
        title: 'Tree Planting Certificate',
        point_cost: 2000,
        description: 'We\'ll plant a tree in your name and send you a certificate'
      }
    ];

    // Apply pagination
    const paginatedRewards = mockRewards.slice(Number(offset), Number(offset) + Number(limit));

    res.json(paginatedRewards);
  } catch (error) {
    console.error('List rewards error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Redeem Reward
 * Processes reward redemption and deducts points from user account
 * Note: Since rewards/points system doesn't exist in provided DB schema, returning mock response
 */
app.post('/api/rewards/:reward_id', authenticateToken, async (req, res) => {
  try {
    const { reward_id } = req.params;

    // Mock points balance (in real implementation would be stored in user profile or separate table)
    const mockCurrentPoints = 1500;
    const mockRewardCost = 500;

    if (mockCurrentPoints < mockRewardCost) {
      return res.status(400).json(createErrorResponse('Insufficient points', null, 'INSUFFICIENT_POINTS'));
    }

    // Mock successful redemption
    const response = {
      message: 'Reward redeemed successfully!',
      remaining_points: mockCurrentPoints - mockRewardCost
    };

    res.json(response);
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Notifications Routes

/*
 * List User Notifications
 * Returns paginated list of user notifications
 * Note: Since notifications table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    // Mock notifications data
    const mockNotifications = [
      {
        id: '1',
        message: 'Great job! You\'ve reached your weekly biking goal.',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        message: 'New challenge available: Plastic-Free February',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        message: 'You\'ve earned 50 points for completing your daily activities!',
        read: false,
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    // Apply pagination
    const paginatedNotifications = mockNotifications.slice(Number(offset), Number(offset) + Number(limit));

    res.json(paginatedNotifications);
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Mark Notification as Read
 * Updates notification read status
 * Note: Since notifications table doesn't exist in provided DB schema, returning mock response
 */
app.put('/api/notifications/:notification_id', authenticateToken, async (req, res) => {
  try {
    const { notification_id } = req.params;
    const { read } = req.body;

    // Mock updated notification
    const updatedNotification = {
      id: notification_id,
      message: 'Great job! You\'ve reached your weekly biking goal.',
      read: Boolean(read),
      created_at: new Date().toISOString()
    };

    res.json(updatedNotification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Achievements Routes

/*
 * List User Achievements
 * Returns list of earned achievements/badges
 * Note: Since achievements table doesn't exist in provided DB schema, returning mock data
 */
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    // Mock achievements data
    const mockAchievements = [
      {
        id: '1',
        title: 'First Steps',
        description: 'Logged your first activity',
        unlocked_at: new Date(Date.now() - 2592000000).toISOString()
      },
      {
        id: '2',
        title: 'Eco Warrior',
        description: 'Completed 30 days of consecutive activity logging',
        unlocked_at: new Date(Date.now() - 1296000000).toISOString()
      },
      {
        id: '3',
        title: 'Community Champion',
        description: 'Joined and completed your first challenge',
        unlocked_at: new Date(Date.now() - 864000000).toISOString()
      }
    ];

    res.json(mockAchievements);
  } catch (error) {
    console.error('List achievements error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Catch-all route for SPA routing (excluding API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app and pool for testing/external use
export { app, pool };

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`eco9 server running on port ${PORT} and listening on 0.0.0.0`);
});