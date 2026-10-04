const express = require('express');
const router = express.Router();
const {
  getFoods,
  getFoodById,
  getMyFoods,
  createFood,
  updateFood,
  deleteFood
} = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getFoods);
router.get('/my', protect, getMyFoods);
router.get('/:id', getFoodById);
router.post('/', protect, upload.single('image'), createFood);
router.put('/:id', protect, updateFood);
router.delete('/:id', protect, deleteFood);

module.exports = router;
