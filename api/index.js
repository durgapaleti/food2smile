const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-Memory Cloud Persistence Store (Shared across all requests)
const db = {
  users: [
    { id: 'u-101', name: 'Ananya Sharma', phone: '9876543210', email: 'funpanda06@gmail.com', passwordHash: 'password123' },
    { id: 'u-102', name: 'Priya Verma', phone: '9876543211', email: 'priya@gmail.com', passwordHash: 'password123' }
  ],
  foods: [
    {
      id: 101,
      owner_id: 'u-101',
      owner_name: 'Ananya Sharma',
      name: 'Fresh Organic Tomatoes',
      category: 'Vegetables',
      quantity: '3 kg',
      location: 'Koramangala, Bangalore',
      original_price: 120,
      action: 'Free',
      discount: 100,
      final_price: 0,
      delivery_option: 'Self Pickup',
      spoiling_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
      description: 'Harvested yesterday from home garden.',
      status: 'Available',
      created_at: new Date().toISOString()
    },
    {
      id: 102,
      owner_id: 'u-102',
      owner_name: 'Priya Verma',
      name: 'Whole Wheat Fresh Bread',
      category: 'Bakery',
      quantity: '2 Loaves',
      location: 'Indiranagar, Bangalore',
      original_price: 90,
      action: 'Discount',
      discount: 50,
      final_price: 45,
      delivery_option: 'Self Pickup',
      spoiling_date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
      description: 'Freshly baked artisanal whole wheat bread.',
      status: 'Available',
      created_at: new Date().toISOString()
    },
    {
      id: 103,
      owner_id: 'u-101',
      owner_name: 'Ananya Sharma',
      name: 'Alphonso Mangoes',
      category: 'Fruits',
      quantity: '5 kg',
      location: 'Whitefield, Bangalore',
      original_price: 600,
      action: 'Sell',
      discount: 30,
      final_price: 420,
      delivery_option: 'Home Delivery',
      spoiling_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80',
      description: 'Sweet juicy mangoes straight from Ratnagiri orchard.',
      status: 'Available',
      created_at: new Date().toISOString()
    }
  ],
  requests: []
};

// HELPER: Auto purge expired foods
function purgeExpired() {
  const today = new Date().toISOString().split('T')[0];
  db.foods.forEach(f => {
    if (f.status === 'Available' && f.spoiling_date && f.spoiling_date < today) {
      f.status = 'Expired';
    }
  });
}

// ---------------- API ENDPOINTS ----------------

// AUTH: REGISTER
app.post('/api/auth/register', (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || (!phone && !email) || !password) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
  }

  const phoneVal = phone ? phone.trim() : '';
  const emailVal = email ? email.trim() : '';

  const existing = db.users.find(u => (phoneVal && u.phone === phoneVal) || (emailVal && u.email === emailVal));
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this phone number or email already exists.' });
  }

  const newUser = {
    id: 'u-' + Date.now(),
    name: name.trim(),
    phone: phoneVal || '9876543210',
    email: emailVal || `${Date.now()}@food2smile.com`,
    passwordHash: password
  };

  db.users.push(newUser);
  const token = crypto.randomBytes(16).toString('hex');

  const safeUser = { id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email };
  res.json({ success: true, message: 'Account created successfully!', user: safeUser, token });
});

// AUTH: LOGIN
app.post('/api/auth/login', (req, res) => {
  const { phone, email, password } = req.body;
  const idVal = (phone || email || '').trim();

  if (!idVal || !password) {
    return res.status(400).json({ success: false, message: 'Please enter phone/email and password.' });
  }

  const user = db.users.find(u => (u.phone === idVal || u.email === idVal) && u.passwordHash === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid phone/email or password.' });
  }

  const token = crypto.randomBytes(16).toString('hex');
  const safeUser = { id: user.id, name: user.name, phone: user.phone, email: user.email };
  res.json({ success: true, message: 'Login successful!', user: safeUser, token });
});

// FOODS: GET LISTINGS
app.get('/api/foods', (req, res) => {
  purgeExpired();
  let foods = [...db.foods];

  const { sort, category, action, search } = req.query;

  if (req.query.action === 'my' && req.query.userId) {
    foods = foods.filter(f => f.owner_id === req.query.userId || f.ownerId === req.query.userId);
    return res.json({ success: true, foods });
  }

  foods = foods.filter(f => f.status === 'Available');

  if (category && category !== 'All') foods = foods.filter(f => f.category === category);
  if (action && action !== 'All') foods = foods.filter(f => f.action === action);
  if (search) {
    const q = search.toLowerCase();
    foods = foods.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || (f.location && f.location.toLowerCase().includes(q)));
  }

  if (sort === 'price-low') foods.sort((a, b) => a.final_price - b.final_price);
  else if (sort === 'price-high') foods.sort((a, b) => b.final_price - a.final_price);
  else if (sort === 'spoiling-soon') foods.sort((a, b) => new Date(a.spoiling_date) - new Date(b.spoiling_date));
  else foods.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  res.json({ success: true, foods });
});

// FOODS: GET SINGLE FOOD
app.get('/api/foods/:id', (req, res) => {
  const food = db.foods.find(f => f.id == req.params.id);
  if (!food) return res.status(404).json({ success: false, message: 'Food listing not found.' });
  res.json({ success: true, food });
});

// FOODS: CREATE LISTING
app.post('/api/foods', (req, res) => {
  const { name, category, quantity, location, originalPrice, action, discount, finalPrice, deliveryOption, spoilingDate, ownerId, ownerName } = req.body;

  if (!name || !category || !quantity || !spoilingDate) {
    return res.status(400).json({ success: false, message: 'Required food details missing.' });
  }

  const newFood = {
    id: Date.now(),
    owner_id: ownerId || 'u-101',
    ownerId: ownerId || 'u-101',
    owner_name: ownerName || 'Community Member',
    ownerName: ownerName || 'Community Member',
    name,
    category,
    quantity,
    location: location || 'Local Pickup',
    original_price: parseFloat(originalPrice) || 0,
    originalPrice: parseFloat(originalPrice) || 0,
    action: action || 'Sell',
    discount: parseInt(discount) || 0,
    final_price: parseFloat(finalPrice) || 0,
    finalPrice: parseFloat(finalPrice) || 0,
    delivery_option: deliveryOption || 'Self Pickup',
    deliveryOption: deliveryOption || 'Self Pickup',
    spoiling_date: spoilingDate,
    spoilingDate: spoilingDate,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
    status: 'Available',
    created_at: new Date().toISOString()
  };

  db.foods.unshift(newFood);
  res.json({ success: true, message: 'Surplus food listed successfully!', food: newFood });
});

// FOODS: DELETE LISTING
app.delete('/api/foods/:id', (req, res) => {
  const idx = db.foods.findIndex(f => f.id == req.params.id);
  if (idx !== -1) {
    db.foods.splice(idx, 1);
  }
  res.json({ success: true, message: 'Listing removed successfully.' });
});

// REQUESTS: GET MY & INCOMING
app.get('/api/requests', (req, res) => {
  const { action, userId } = req.query;
  let requests = [...db.requests];

  if (action === 'my' && userId) {
    requests = requests.filter(r => r.requester_id === userId || r.requesterId === userId);
  } else if (action === 'received' && userId) {
    requests = requests.filter(r => r.owner_id === userId || r.ownerId === userId);
  }

  res.json({ success: true, requests });
});

// REQUESTS: CREATE REQUEST
app.post('/api/requests', (req, res) => {
  const { foodId, requesterId, requesterName, requesterPhone } = req.body;
  const food = db.foods.find(f => f.id == foodId);

  const newReq = {
    id: Date.now(),
    food_id: food ? food.id : foodId,
    foodId: food ? food.id : foodId,
    food_name: food ? food.name : 'Surplus Food',
    foodName: food ? food.name : 'Surplus Food',
    category: food ? food.category : 'General',
    action: food ? food.action : 'Free',
    price: food ? food.final_price : 0,
    requester_id: requesterId || 'u-102',
    requesterId: requesterId || 'u-102',
    requester_name: requesterName || 'Interested Neighbor',
    requesterName: requesterName || 'Interested Neighbor',
    requester_phone: requesterPhone || '9876543210',
    owner_id: food ? food.owner_id : 'u-101',
    ownerId: food ? food.owner_id : 'u-101',
    owner_name: food ? food.owner_name : 'Ananya Sharma',
    ownerName: food ? food.owner_name : 'Ananya Sharma',
    status: 'Pending',
    created_at: new Date().toISOString().split('T')[0]
  };

  db.requests.unshift(newReq);
  res.json({ success: true, message: 'Food request sent to owner!', request: newReq });
});

// REQUESTS: ACCEPT / REJECT / COMPLETE
app.post('/api/requests/action', (req, res) => {
  const { id, action } = req.body;
  const reqItem = db.requests.find(r => r.id == id);

  if (reqItem) {
    if (action === 'accept') {
      reqItem.status = 'Accepted';
      const food = db.foods.find(f => f.id == reqItem.food_id);
      if (food) food.status = 'Requested';
    } else if (action === 'reject') {
      reqItem.status = 'Rejected';
    } else if (action === 'complete') {
      reqItem.status = 'Completed';
      const food = db.foods.find(f => f.id == reqItem.food_id);
      if (food) food.status = 'Completed';
    }
  }

  res.json({ success: true, message: `Request status set to ${action}.` });
});

// DASHBOARD: STATS
app.get('/api/dashboard', (req, res) => {
  purgeExpired();
  const foods = db.foods;
  const requests = db.requests;

  const stats = {
    totalListed: foods.length,
    availableCount: foods.filter(f => f.status === 'Available').length,
    soldCount: foods.filter(f => f.status === 'Sold').length,
    givenCount: foods.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length,
    donatedCount: foods.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length,
    savedCount: foods.filter(f => f.status === 'Completed' || f.status === 'Sold' || f.status === 'Given' || f.status === 'Donated').length,
    recentFoods: foods.slice(0, 5),
    recentRequests: requests.slice(0, 5)
  };

  res.json({ success: true, stats });
});

module.exports = app;
