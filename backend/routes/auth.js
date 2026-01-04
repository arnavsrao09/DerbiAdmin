import express from 'express';
import Admin from '../models/Admin.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize admin user if it doesn't exist
const initializeAdmin = async () => {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const defaultAdmin = new Admin({
      username: 'admin',
      password: 'admin123' // Change this in production!
    });
    await defaultAdmin.save();
    console.log('Default admin user created: admin/admin123');
  }
};

initializeAdmin();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(username, rememberMe);

    res.json({
      message: 'Login successful',
      token,
      username: admin.username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Token verification is handled by middleware, but this endpoint
    // can be used to check if token is still valid
    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

