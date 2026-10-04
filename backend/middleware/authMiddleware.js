const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const inMemoryStore = require('../config/inMemoryStore');

const isMongo = () => mongoose.connection.readyState === 1;

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'food2smile_super_secret_jwt_key_2026');

      if (isMongo()) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        req.user = inMemoryStore.findUserById(decoded.id);
      }

      if (!req.user) {
        req.user = { id: decoded.id, name: decoded.name, email: decoded.email, phone: decoded.phone };
      } else {
        // Ensure id property is present
        req.user.id = req.user._id || req.user.id;
      }

      return next();
    } catch (error) {
      console.error('Auth verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
