const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMySentRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  completeRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMySentRequests);
router.get('/received', protect, getReceivedRequests);
router.put('/:id/accept', protect, acceptRequest);
router.put('/:id/reject', protect, rejectRequest);
router.put('/:id/complete', protect, completeRequest);

module.exports = router;
