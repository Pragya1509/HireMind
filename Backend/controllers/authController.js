// backend/controllers/authController.js
const User = require('../models/User');
const jwt  = require('jsonwebtoken');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── SIGNUP ────────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Accept 'candidate' or 'recruiter' from signup form; default to 'candidate'
    const allowedRoles = ['candidate', 'recruiter'];
    const userRole = allowedRoles.includes(role) ? role : 'candidate';

    const user = await User.create({ name, email, password, role: userRole });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
};

// ── GET ME ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logout successful' });
};