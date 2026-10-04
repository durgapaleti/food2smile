const mongoose = require('mongoose');
const Food = require('../models/Food');
const inMemoryStore = require('../config/inMemoryStore');

const isMongo = () => mongoose.connection.readyState === 1;

// Helper to purge expired listings before returning queries
const purgeExpired = async () => {
  if (!isMongo()) return;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    await Food.updateMany(
      { status: 'Available', spoilingDate: { $lt: startOfToday } },
      { $set: { status: 'Expired' } }
    );
  } catch (err) {
    console.warn('Auto expiry update notice:', err.message);
  }
};

// @desc    Get all available food listings with search, filter, sort
// @route   GET /api/foods
// @access  Public
const getFoods = async (req, res) => {
  try {
    const { search, category, action, sort } = req.query;

    if (isMongo()) {
      await purgeExpired();
      let query = { status: 'Available' };

      if (category && category !== 'All') query.category = category;
      if (action && action !== 'All') query.action = action;

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { category: searchRegex },
          { location: searchRegex }
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'price-low') sortOptions = { finalPrice: 1 };
      if (sort === 'price-high') sortOptions = { finalPrice: -1 };
      if (sort === 'spoiling-soon') sortOptions = { spoilingDate: 1 };

      const foods = await Food.find(query).sort(sortOptions).populate('owner', 'name email phone');
      return res.json({ success: true, count: foods.length, foods });
    } else {
      let foods = inMemoryStore.getFoods({ category, action, search, status: 'Available' });
      
      if (sort === 'price-low') foods.sort((a, b) => a.finalPrice - b.finalPrice);
      if (sort === 'price-high') foods.sort((a, b) => b.finalPrice - a.finalPrice);
      if (sort === 'spoiling-soon') foods.sort((a, b) => new Date(a.spoilingDate) - new Date(b.spoilingDate));

      return res.json({ success: true, count: foods.length, foods });
    }
  } catch (error) {
    console.error('getFoods error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single food by ID
// @route   GET /api/foods/:id
// @access  Public
const getFoodById = async (req, res) => {
  try {
    let food;
    if (isMongo()) {
      food = await Food.findById(req.params.id).populate('owner', 'name email phone');
    } else {
      food = inMemoryStore.findFoodById(req.params.id);
    }

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }
    return res.json({ success: true, food });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get foods listed by logged-in user
// @route   GET /api/foods/my
// @access  Private
const getMyFoods = async (req, res) => {
  try {
    if (isMongo()) {
      await purgeExpired();
      const foods = await Food.find({ owner: req.user.id }).sort({ createdAt: -1 });
      return res.json({ success: true, count: foods.length, foods });
    } else {
      const foods = inMemoryStore.getFoods({ owner: req.user.id });
      return res.json({ success: true, count: foods.length, foods });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new food listing
// @route   POST /api/foods
// @access  Private
const createFood = async (req, res) => {
  try {
    const {
      name,
      category,
      quantity,
      location,
      originalPrice,
      action,
      discount,
      finalPrice,
      deliveryOption,
      spoilingDate,
      description
    } = req.body;

    if (!name || !category || !quantity || !spoilingDate || !action) {
      return res.status(400).json({ success: false, message: 'Please provide all required food details.' });
    }

    let image = req.file ? req.file.path : undefined;

    if (isMongo()) {
      const newFood = await Food.create({
        owner: req.user.id,
        ownerName: req.user.name,
        name: name.trim(),
        category,
        quantity: quantity.trim(),
        location: location ? location.trim() : 'Local Pickup',
        originalPrice: Number(originalPrice) || 0,
        action,
        discount: Number(discount) || 0,
        finalPrice: Number(finalPrice) || 0,
        deliveryOption: deliveryOption || 'Self Pickup',
        spoilingDate: new Date(spoilingDate),
        image,
        description: description || '',
        status: 'Available'
      });

      return res.status(201).json({ success: true, message: 'Food listed successfully!', food: newFood });
    } else {
      const newFood = inMemoryStore.createFood({
        owner: req.user.id,
        ownerName: req.user.name,
        name: name.trim(),
        category,
        quantity: quantity.trim(),
        location: location ? location.trim() : 'Local Pickup',
        originalPrice: Number(originalPrice) || 0,
        action,
        discount: Number(discount) || 0,
        finalPrice: Number(finalPrice) || 0,
        deliveryOption: deliveryOption || 'Self Pickup',
        spoilingDate: new Date(spoilingDate),
        image: image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
        description: description || ''
      });

      return res.status(201).json({ success: true, message: 'Food listed successfully!', food: newFood });
    }
  } catch (error) {
    console.error('createFood error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update food listing
// @route   PUT /api/foods/:id
// @access  Private (Owner only)
const updateFood = async (req, res) => {
  try {
    if (isMongo()) {
      let food = await Food.findById(req.params.id);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food listing not found' });
      }

      if (food.owner.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this listing' });
      }

      food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      return res.json({ success: true, message: 'Listing updated successfully', food });
    } else {
      let food = inMemoryStore.findFoodById(req.params.id);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food listing not found' });
      }

      if (String(food.owner) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this listing' });
      }

      food = inMemoryStore.updateFood(req.params.id, req.body);
      return res.json({ success: true, message: 'Listing updated successfully', food });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete food listing
// @route   DELETE /api/foods/:id
// @access  Private (Owner only)
const deleteFood = async (req, res) => {
  try {
    if (isMongo()) {
      const food = await Food.findById(req.params.id);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food listing not found' });
      }

      if (food.owner.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
      }

      await food.deleteOne();
      return res.json({ success: true, message: 'Listing removed successfully' });
    } else {
      const food = inMemoryStore.findFoodById(req.params.id);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food listing not found' });
      }

      if (String(food.owner) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
      }

      inMemoryStore.deleteFood(req.params.id);
      return res.json({ success: true, message: 'Listing removed successfully' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFoods,
  getFoodById,
  getMyFoods,
  createFood,
  updateFood,
  deleteFood
};
