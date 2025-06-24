import express from 'express';
import { registerUser, loginUser } from '../services/authService';
import { validateRegisterData, validateLoginData } from '../utils/validation';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    // Validate input data
    const validationErrors = validateRegisterData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Register user and get token
    const result = await registerUser(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already exists' || error.message === 'Username already exists') {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    // Validate input data
    const validationErrors = validateLoginData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Login user
    const result = await loginUser(req.body);

    res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;