const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const inMemoryStore = require('../config/inMemoryStore');

const isMongo = () => mongoose.connection.readyState === 1;

const cleanPhone = (val) => {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(-10);
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, name: user.name, email: user.email, phone: user.phone },
    process.env.JWT_SECRET || 'food2smile_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const cleanedPhone = cleanPhone(phone || email);
    const userEmail = email && email.includes('@') ? email.toLowerCase().trim() : (cleanedPhone ? `${cleanedPhone}@food2smile.local` : '');

    if (isMongo()) {
      const userExists = await User.findOne({ 
        $or: [
          { email: userEmail || '____' },
          { phone: cleanedPhone || '____' }
        ]
      });

      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this phone or email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name.trim(),
        email: userEmail,
        phone: cleanedPhone,
        password: hashedPassword
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage }
      });
    } else {
      const existing = inMemoryStore.findUserByEmailOrPhone({ email: userEmail, phone: cleanedPhone });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this phone or email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = inMemoryStore.createUser({
        name: name.trim(),
        email: userEmail,
        phone: cleanedPhone,
        password: hashedPassword,
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: 'Please enter phone number/email and password.' });
    }

    const rawInput = (email || phone || '').trim();
    const isEmail = rawInput.includes('@');
    const cleanedDigits = cleanPhone(rawInput);

    let user;
    if (isMongo()) {
      if (isEmail) {
        user = await User.findOne({ email: rawInput.toLowerCase() }).select('+password');
      } else {
        user = await User.findOne({
          $or: [
            { phone: cleanedDigits },
            { phone: rawInput },
            { email: `${cleanedDigits}@food2smile.local` }
          ]
        }).select('+password');
      }
    } else {
      user = inMemoryStore.findUserByEmailOrPhone({ email: rawInput, phone: cleanedDigits });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials. Please check your phone number/email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (isMongo()) {
      const user = await User.findById(req.user.id).select('-password');
      if (user) return res.json({ success: true, user });
    } else {
      const user = inMemoryStore.findUserById(req.user.id);
      if (user) return res.json({ success: true, user });
    }
    return res.json({ success: true, user: req.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
