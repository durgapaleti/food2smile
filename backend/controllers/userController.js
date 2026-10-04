const mongoose = require('mongoose');
const User = require('../models/User');
const Food = require('../models/Food');
const Request = require('../models/Request');
const inMemoryStore = require('../config/inMemoryStore');

const isMongo = () => mongoose.connection.readyState === 1;

// @desc    Get real-time dashboard statistics (Personal & Community totals)
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongo()) {
      // 1. Personal Stats
      const myFoods = await Food.find({ owner: userId });
      const personalListed = myFoods.length;
      const personalAvailable = myFoods.filter(f => f.status === 'Available').length;
      const personalSold = myFoods.filter(f => f.status === 'Sold' || ((f.action === 'Sell' || f.action === 'Discount') && f.status === 'Completed')).length;
      const personalGiven = myFoods.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length;
      const personalDonated = myFoods.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length;
      const personalSaved = personalSold + personalGiven + personalDonated + myFoods.filter(f => f.status === 'Completed').length;
      const personalPendingRequests = await Request.countDocuments({ owner: userId, status: 'Pending' });

      // 2. Community Overall Stats
      const allFoods = await Food.find({});
      const communityListed = allFoods.length;
      const communityAvailable = allFoods.filter(f => f.status === 'Available').length;
      const communitySold = allFoods.filter(f => f.status === 'Sold' || ((f.action === 'Sell' || f.action === 'Discount') && f.status === 'Completed')).length;
      const communityGiven = allFoods.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length;
      const communityDonated = allFoods.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length;
      const communitySaved = communitySold + communityGiven + communityDonated + allFoods.filter(f => f.status === 'Completed').length;

      const recentFoods = await Food.find({ owner: userId }).sort({ createdAt: -1 }).limit(5);
      const recentRequests = await Request.find({ $or: [{ owner: userId }, { requester: userId }] }).sort({ createdAt: -1 }).limit(5);

      const communityFoods = await Food.find({}).sort({ createdAt: -1 }).limit(5);
      const communityRequests = await Request.find({}).sort({ createdAt: -1 }).limit(5);

      return res.json({
        success: true,
        stats: {
          listedCount: personalListed,
          availableCount: personalAvailable,
          soldCount: personalSold,
          givenCount: personalGiven,
          donatedCount: personalDonated,
          savedCount: personalSaved,
          pendingRequestsCount: personalPendingRequests
        },
        communityStats: {
          listedCount: communityListed,
          availableCount: communityAvailable,
          soldCount: communitySold,
          givenCount: communityGiven,
          donatedCount: communityDonated,
          savedCount: communitySaved
        },
        recentFoods,
        recentRequests,
        communityFoods,
        communityRequests
      });
    } else {
      // In-Memory Mode
      const myFoods = inMemoryStore.getFoods({ owner: userId });
      const personalListed = myFoods.length;
      const personalAvailable = myFoods.filter(f => f.status === 'Available').length;
      const personalSold = myFoods.filter(f => f.status === 'Sold' || ((f.action === 'Sell' || f.action === 'Discount') && f.status === 'Completed')).length;
      const personalGiven = myFoods.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length;
      const personalDonated = myFoods.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length;
      const personalSaved = personalSold + personalGiven + personalDonated + myFoods.filter(f => f.status === 'Completed').length;
      const myRequests = inMemoryStore.getRequestsForUser(userId);
      const personalPendingRequests = myRequests.filter(r => String(r.owner) === String(userId) && r.status === 'Pending').length;

      // All Community Store Foods
      const allFoods = inMemoryStore.foods || [];
      const communityListed = allFoods.length;
      const communityAvailable = allFoods.filter(f => f.status === 'Available').length;
      const communitySold = allFoods.filter(f => f.status === 'Sold' || ((f.action === 'Sell' || f.action === 'Discount') && f.status === 'Completed')).length;
      const communityGiven = allFoods.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length;
      const communityDonated = allFoods.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length;
      const communitySaved = communitySold + communityGiven + communityDonated + allFoods.filter(f => f.status === 'Completed').length;

      return res.json({
        success: true,
        stats: {
          listedCount: personalListed,
          availableCount: personalAvailable,
          soldCount: personalSold,
          givenCount: personalGiven,
          donatedCount: personalDonated,
          savedCount: personalSaved,
          pendingRequestsCount: personalPendingRequests
        },
        communityStats: {
          listedCount: communityListed,
          availableCount: communityAvailable,
          soldCount: communitySold,
          givenCount: communityGiven,
          donatedCount: communityDonated,
          savedCount: communitySaved
        },
        recentFoods: myFoods.slice(0, 5),
        recentRequests: myRequests.slice(0, 5),
        communityFoods: allFoods.slice(0, 5),
        communityRequests: (inMemoryStore.requests || []).slice(0, 5)
      });
    }
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    if (isMongo()) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, user });
    } else {
      const user = inMemoryStore.findUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, user });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (isMongo()) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (name) user.name = name.trim();
      if (email) user.email = email.toLowerCase().trim();
      if (phone) user.phone = phone.trim();

      if (req.file) user.profileImage = req.file.path;

      await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage }
      });
    } else {
      const user = inMemoryStore.findUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (name) user.name = name.trim();
      if (email) user.email = email.toLowerCase().trim();
      if (phone) user.phone = phone.trim();
      if (req.file) user.profileImage = req.file.path;

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage }
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUserProfile,
  updateUserProfile
};
