const mongoose = require('mongoose');
const Request = require('../models/Request');
const Food = require('../models/Food');
const inMemoryStore = require('../config/inMemoryStore');

const isMongo = () => mongoose.connection.readyState === 1;

// @desc    Create a food request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
  try {
    const { foodId, message } = req.body;

    if (!foodId) {
      return res.status(400).json({ success: false, message: 'Please provide food ID' });
    }

    if (isMongo()) {
      const food = await Food.findById(foodId);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food item not found' });
      }

      if (food.owner.toString() === req.user.id.toString()) {
        return res.status(400).json({ success: false, message: 'You cannot request your own listed food item!' });
      }

      const existing = await Request.findOne({
        food: food._id,
        requester: req.user.id,
        status: { $ne: 'Rejected' }
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already submitted a request for this food.' });
      }

      const request = await Request.create({
        food: food._id,
        foodName: food.name,
        category: food.category,
        action: food.action,
        price: food.finalPrice,
        requester: req.user.id,
        requesterName: req.user.name,
        requesterEmail: req.user.email,
        requesterPhone: req.user.phone,
        owner: food.owner,
        ownerName: food.ownerName,
        status: 'Pending',
        message: message || ''
      });

      food.status = 'Requested';
      await food.save();

      return res.status(201).json({ success: true, message: 'Request submitted successfully!', request });
    } else {
      const food = inMemoryStore.findFoodById(foodId);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food item not found' });
      }

      if (String(food.owner) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'You cannot request your own listed food item!' });
      }

      const request = inMemoryStore.createRequest({
        food: food._id,
        foodName: food.name,
        category: food.category,
        action: food.action,
        price: food.finalPrice,
        requester: req.user.id,
        requesterName: req.user.name,
        requesterEmail: req.user.email,
        requesterPhone: req.user.phone,
        owner: food.owner,
        ownerName: food.ownerName,
        message: message || ''
      });

      inMemoryStore.updateFood(food._id, { status: 'Requested' });
      return res.status(201).json({ success: true, message: 'Request submitted successfully!', request });
    }
  } catch (error) {
    console.error('createRequest error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get requests sent by logged in user
// @route   GET /api/requests/my
// @access  Private
const getMySentRequests = async (req, res) => {
  try {
    if (isMongo()) {
      const requests = await Request.find({ requester: req.user.id })
        .populate('food')
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 });
      return res.json({ success: true, count: requests.length, requests });
    } else {
      const allReqs = inMemoryStore.getRequestsForUser(req.user.id);
      const requests = allReqs.filter(r => String(r.requester) === String(req.user.id));
      return res.json({ success: true, count: requests.length, requests });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get incoming requests for owner's food
// @route   GET /api/requests/received
// @access  Private
const getReceivedRequests = async (req, res) => {
  try {
    if (isMongo()) {
      const requests = await Request.find({ owner: req.user.id })
        .populate('food')
        .populate('requester', 'name email phone')
        .sort({ createdAt: -1 });
      return res.json({ success: true, count: requests.length, requests });
    } else {
      const allReqs = inMemoryStore.getRequestsForUser(req.user.id);
      const requests = allReqs.filter(r => String(r.owner) === String(req.user.id));
      return res.json({ success: true, count: requests.length, requests });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept request
// @route   PUT /api/requests/:id/accept
// @access  Private (Owner only)
const acceptRequest = async (req, res) => {
  try {
    if (isMongo()) {
      const request = await Request.findById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      if (request.owner.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

      request.status = 'Accepted';
      await request.save();
      await Food.findByIdAndUpdate(request.food, { status: 'Requested' });

      return res.json({ success: true, message: 'Request accepted!', request });
    } else {
      const request = inMemoryStore.findRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      if (String(request.owner) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not authorized' });

      inMemoryStore.updateRequest(req.params.id, { status: 'Accepted' });
      inMemoryStore.updateFood(request.food, { status: 'Requested' });

      return res.json({ success: true, message: 'Request accepted!', request });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject request
// @route   PUT /api/requests/:id/reject
// @access  Private (Owner only)
const rejectRequest = async (req, res) => {
  try {
    if (isMongo()) {
      const request = await Request.findById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      if (request.owner.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

      request.status = 'Rejected';
      await request.save();

      const otherPending = await Request.findOne({
        food: request.food,
        _id: { $ne: request._id },
        status: { $in: ['Pending', 'Accepted'] }
      });

      if (!otherPending) {
        await Food.findByIdAndUpdate(request.food, { status: 'Available' });
      }

      return res.json({ success: true, message: 'Request rejected', request });
    } else {
      const request = inMemoryStore.findRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      if (String(request.owner) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not authorized' });

      inMemoryStore.updateRequest(req.params.id, { status: 'Rejected' });
      inMemoryStore.updateFood(request.food, { status: 'Available' });

      return res.json({ success: true, message: 'Request rejected', request });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete request & update food item status
// @route   PUT /api/requests/:id/complete
// @access  Private
const completeRequest = async (req, res) => {
  try {
    if (isMongo()) {
      const request = await Request.findById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      if (request.owner.toString() !== req.user.id.toString() && request.requester.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      request.status = 'Completed';
      await request.save();

      const food = await Food.findById(request.food);
      if (food) {
        if (food.action === 'Sell' || food.action === 'Discount') food.status = 'Sold';
        else if (food.action === 'Free') food.status = 'Given';
        else if (food.action === 'Donate') food.status = 'Donated';
        else food.status = 'Completed';
        await food.save();
      }

      return res.json({ success: true, message: 'Transaction marked as completed!', request });
    } else {
      const request = inMemoryStore.findRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      if (String(request.owner) !== String(req.user.id) && String(request.requester) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      inMemoryStore.updateRequest(req.params.id, { status: 'Completed' });
      const food = inMemoryStore.findFoodById(request.food);
      if (food) {
        let newStatus = 'Completed';
        if (food.action === 'Sell' || food.action === 'Discount') newStatus = 'Sold';
        else if (food.action === 'Free') newStatus = 'Given';
        else if (food.action === 'Donate') newStatus = 'Donated';
        inMemoryStore.updateFood(food._id, { status: newStatus });
      }

      return res.json({ success: true, message: 'Transaction marked as completed!', request });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  getMySentRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  completeRequest
};
