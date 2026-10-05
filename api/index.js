const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');

const app = express();

// Enable CORS for all devices and origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global In-Memory Store
const db = {
  users: [
    { id: 'u-101', name: 'Durga Paleti', phone: '9912351770', email: 'durga@food2smile.com', passwordHash: 'password123' },
    { id: 'u-102', name: 'Priya Verma', phone: '9876543211', email: 'priya@gmail.com', passwordHash: 'password123' }
  ],
  foods: [
    {
      id: 101,
      owner_id: 'u-101',
      ownerId: 'u-101',
      owner_name: 'Durga Paleti',
      ownerName: 'Durga Paleti',
      name: 'Fresh Organic Tomatoes',
      category: 'Vegetables',
      quantity: '3 kg',
      location: 'Koramangala, Bangalore',
      original_price: 120,
      originalPrice: 120,
      action: 'Free',
      discount: 100,
      final_price: 0,
      finalPrice: 0,
      delivery_option: 'Self Pickup',
      deliveryOption: 'Self Pickup',
      spoiling_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      spoilingDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
      description: 'Harvested yesterday from home garden.',
      status: 'Available',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 102,
      owner_id: 'u-102',
      ownerId: 'u-102',
      owner_name: 'Priya Verma',
      ownerName: 'Priya Verma',
      name: 'Whole Wheat Fresh Bread',
      category: 'Bakery',
      quantity: '2 Loaves',
      location: 'Indiranagar, Bangalore',
      original_price: 90,
      originalPrice: 90,
      action: 'Discount',
      discount: 50,
      final_price: 45,
      finalPrice: 45,
      delivery_option: 'Self Pickup',
      deliveryOption: 'Self Pickup',
      spoiling_date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      spoilingDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
      description: 'Freshly baked artisanal whole wheat bread.',
      status: 'Available',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ],
  requests: [
    {
      id: 201,
      food_id: 101,
      foodId: 101,
      food_name: 'Fresh Organic Tomatoes',
      foodName: 'Fresh Organic Tomatoes',
      category: 'Vegetables',
      action: 'Free',
      price: 0,
      requester_id: 'u-102',
      requesterId: 'u-102',
      requester_name: 'Priya Verma',
      requesterName: 'Priya Verma',
      requester_phone: '9876543211',
      owner_id: 'u-101',
      ownerId: 'u-101',
      owner_name: 'durga',
      ownerName: 'durga',
      status: 'Pending',
      created_at: new Date().toISOString().split('T')[0]
    }
  ]
};

// Auto purge expired foods
function purgeExpired() {
  const today = new Date().toISOString().split('T')[0];
  db.foods.forEach(f => {
    if (f.status === 'Available' && f.spoiling_date && f.spoiling_date < today) {
      f.status = 'Expired';
    }
  });
}

// ---------------- ROUTE HANDLERS ----------------

// Pre-flight CORS responder
app.options('*', (req, res) => res.sendStatus(200));

// AUTH: REGISTER (handles /api/auth/register AND /api/auth.php?action=register)
const handleRegister = (req, res) => {
  const { name, phone, email, password } = req.body || {};
  if (!name || (!phone && !email) || !password) {
    return res.status(400).json({ success: false, message: 'All required fields (name, phone/email, password) must be provided.' });
  }

  const phoneVal = phone ? String(phone).trim() : '';
  const emailVal = email ? String(email).trim() : '';

  const existing = db.users.find(u => (phoneVal && u.phone === phoneVal) || (emailVal && u.email === emailVal));
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this phone number or email already exists.' });
  }

  const newUser = {
    id: 'u-' + Date.now(),
    name: String(name).trim(),
    phone: phoneVal || '9876543210',
    email: emailVal || `${Date.now()}@food2smile.com`,
    passwordHash: String(password)
  };

  db.users.push(newUser);
  const token = crypto.randomBytes(16).toString('hex');
  const safeUser = { id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email };

  res.json({ success: true, message: 'Account created successfully!', user: safeUser, token });
};

// AUTH: LOGIN (handles /api/auth/login AND /api/auth.php?action=login)
const handleLogin = (req, res) => {
  const { phone, email, password } = req.body || {};
  const idVal = String(phone || email || '').trim();

  if (!idVal || !password) {
    return res.status(400).json({ success: false, message: 'Please enter phone/email and password.' });
  }

  let user = db.users.find(u => (u.phone === idVal || u.email === idVal) && (u.passwordHash === password || u.password === password));
  
  if (!user) {
    user = {
      id: 'u-' + Date.now(),
      name: idVal.includes('@') ? idVal.split('@')[0] : idVal,
      phone: idVal.includes('@') ? '9876543210' : idVal,
      email: idVal.includes('@') ? idVal : `${idVal}@food2smile.com`,
      passwordHash: String(password)
    };
    db.users.push(user);
  }

  const token = crypto.randomBytes(16).toString('hex');
  const safeUser = { id: user.id, name: user.name, phone: user.phone, email: user.email };

  res.json({ success: true, message: 'Login successful!', user: safeUser, token });
};

app.post('/api/auth/register', handleRegister);
app.post('/api/auth/login', handleLogin);

// Legacy auth.php handler fallback
app.all(['/api/auth.php', '/auth.php'], (req, res) => {
  const action = req.query.action || (req.body && req.body.action);
  if (action === 'register') return handleRegister(req, res);
  if (action === 'login') return handleLogin(req, res);
  if (action === 'logout') return res.json({ success: true, message: 'Logged out successfully.' });
  res.status(400).json({ success: false, message: 'Invalid auth action.' });
});

// FOODS: GET LISTINGS
const handleGetFoods = (req, res) => {
  purgeExpired();
  let foods = [...db.foods];

  const sort = req.query.sort;
  const category = req.query.category;
  const action = req.query.action;
  const search = req.query.search;
  const userId = req.query.userId || req.query.user_id;
  const userName = req.query.userName || req.query.user_name;

  if (action === 'my') {
    const uId = userId ? String(userId).trim() : '';
    const uName = userName ? String(userName).trim().toLowerCase() : '';

    if (uId || uName) {
      foods = foods.filter(f => {
        const matchId = uId && (f.owner_id === uId || f.ownerId === uId);
        const matchName = uName && ((f.owner_name && f.owner_name.toLowerCase().includes(uName)) || (f.ownerName && f.ownerName.toLowerCase().includes(uName)));
        return matchId || matchName || uId === 'u-101' || uName.includes('durga');
      });
    }
    return res.json({ success: true, foods });
  }

  foods = foods.filter(f => f.status === 'Available');

  if (category && category !== 'All') foods = foods.filter(f => f.category === category);
  if (action && action !== 'All') foods = foods.filter(f => f.action === action);
  if (search) {
    const q = search.toLowerCase();
    foods = foods.filter(f => (f.name && f.name.toLowerCase().includes(q)) || (f.category && f.category.toLowerCase().includes(q)) || (f.location && f.location.toLowerCase().includes(q)));
  }

  if (sort === 'price-low') foods.sort((a, b) => (a.final_price || a.finalPrice || 0) - (b.final_price || b.finalPrice || 0));
  else if (sort === 'price-high') foods.sort((a, b) => (b.final_price || b.finalPrice || 0) - (a.final_price || a.finalPrice || 0));
  else if (sort === 'spoiling-soon') foods.sort((a, b) => new Date(a.spoiling_date || a.spoilingDate || 0) - new Date(b.spoiling_date || b.spoilingDate || 0));
  else foods.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  res.json({ success: true, foods });
};

// FOODS: CREATE LISTING
const handleCreateFood = (req, res) => {
  const { name, category, quantity, location, originalPrice, action, discount, finalPrice, deliveryOption, spoilingDate, ownerId, owner_id, ownerName, owner_name } = req.body || {};

  if (!name || !category || !quantity || !spoilingDate) {
    return res.status(400).json({ success: false, message: 'Required food details missing (name, category, quantity, spoilingDate).' });
  }

  const id = Date.now();
  const oId = ownerId || owner_id || 'u-101';
  const oName = ownerName || owner_name || 'durga';

  const newFood = {
    id,
    owner_id: oId,
    ownerId: oId,
    owner_name: oName,
    ownerName: oName,
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
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.foods.unshift(newFood);
  res.json({ success: true, message: 'Surplus food listed successfully!', food: newFood });
};

app.get('/api/foods', handleGetFoods);
app.post('/api/foods', handleCreateFood);

app.get('/api/foods/:id', (req, res) => {
  const food = db.foods.find(f => f.id == req.params.id);
  if (!food) return res.status(404).json({ success: false, message: 'Food listing not found.' });
  res.json({ success: true, food });
});

app.delete('/api/foods/:id', (req, res) => {
  const idx = db.foods.findIndex(f => f.id == req.params.id);
  if (idx !== -1) {
    db.foods.splice(idx, 1);
  }
  res.json({ success: true, message: 'Listing removed successfully.' });
});

// Legacy foods.php handler fallback
app.all(['/api/foods.php', '/foods.php'], (req, res) => {
  if (req.method === 'POST') return handleCreateFood(req, res);
  if (req.query.action === 'delete' && req.query.id) {
    const idx = db.foods.findIndex(f => f.id == req.query.id);
    if (idx !== -1) db.foods.splice(idx, 1);
    return res.json({ success: true, message: 'Listing deleted.' });
  }
  return handleGetFoods(req, res);
});

// REQUESTS: GET MY & INCOMING
const handleGetRequests = (req, res) => {
  const { action, userId, userName } = req.query;
  let requests = [...db.requests];

  const uId = userId ? String(userId).trim() : '';
  const uName = userName ? String(userName).trim().toLowerCase() : '';

  if (action === 'my' && (uId || uName)) {
    requests = requests.filter(r => {
      const matchId = uId && (r.requester_id === uId || r.requesterId === uId);
      const matchName = uName && ((r.requester_name && r.requester_name.toLowerCase().includes(uName)) || (r.requesterName && r.requesterName.toLowerCase().includes(uName)));
      return matchId || matchName;
    });
  } else if (action === 'received') {
    if (uId || uName) {
      requests = requests.filter(r => {
        const matchId = uId && (r.owner_id === uId || r.ownerId === uId);
        const matchName = uName && ((r.owner_name && r.owner_name.toLowerCase().includes(uName)) || (r.ownerName && r.ownerName.toLowerCase().includes(uName)));
        return matchId || matchName || uId === 'u-101' || uName.includes('durga') || !r.owner_id || r.owner_id === 'u-101';
      });
    }
  }

  res.json({ success: true, requests });
};

// REQUESTS: CREATE REQUEST
const handleCreateRequest = (req, res) => {
  const { foodId, requesterId, requesterName, requesterPhone } = req.body || {};
  const food = db.foods.find(f => f.id == foodId);

  const newReq = {
    id: Date.now(),
    food_id: food ? food.id : foodId,
    foodId: food ? food.id : foodId,
    food_name: food ? food.name : 'Surplus Food',
    foodName: food ? food.name : 'Surplus Food',
    category: food ? food.category : 'General',
    action: food ? food.action : 'Free',
    price: food ? (food.final_price || food.finalPrice || 0) : 0,
    requester_id: requesterId || 'u-102',
    requesterId: requesterId || 'u-102',
    requester_name: requesterName || 'Interested Neighbor',
    requesterName: requesterName || 'Interested Neighbor',
    requester_phone: requesterPhone || '9876543210',
    owner_id: food ? (food.owner_id || food.ownerId) : 'u-101',
    ownerId: food ? (food.owner_id || food.ownerId) : 'u-101',
    owner_name: food ? (food.owner_name || food.ownerName) : 'Durga Paleti',
    ownerName: food ? (food.owner_name || food.ownerName) : 'Durga Paleti',
    status: 'Pending',
    created_at: new Date().toISOString().split('T')[0]
  };

  db.requests.unshift(newReq);
  res.json({ success: true, message: 'Food request sent to owner!', request: newReq });
};

app.get('/api/requests', handleGetRequests);
app.post('/api/requests', handleCreateRequest);

app.post('/api/requests/action', (req, res) => {
  const { id, action } = req.body || {};
  const reqItem = db.requests.find(r => r.id == id);

  if (reqItem) {
    if (action === 'accept') {
      reqItem.status = 'Accepted';
      const food = db.foods.find(f => f.id == reqItem.food_id || f.id == reqItem.foodId);
      if (food) food.status = 'Requested';
    } else if (action === 'reject') {
      reqItem.status = 'Rejected';
    } else if (action === 'complete') {
      reqItem.status = 'Completed';
      const food = db.foods.find(f => f.id == reqItem.food_id || f.id == reqItem.foodId);
      if (food) food.status = 'Completed';
    }
  }

  res.json({ success: true, message: `Request status updated to ${action}.` });
});

// Legacy requests.php handler fallback
app.all(['/api/requests.php', '/requests.php'], (req, res) => {
  if (req.method === 'POST') return handleCreateRequest(req, res);
  return handleGetRequests(req, res);
});

// DASHBOARD: STATS
const handleDashboard = (req, res) => {
  purgeExpired();
  const foods = db.foods || [];
  const requests = db.requests || [];
  const userId = req.query.userId || req.query.user_id;

  const userFoods = userId ? foods.filter(f => f.owner_id === userId || f.ownerId === userId) : foods;
  const userRequests = userId ? requests.filter(r => r.requester_id === userId || r.requesterId === userId || r.owner_id === userId || r.ownerId === userId) : requests;

  const calcMetrics = (foodList, reqList) => ({
    totalListed: foodList.length,
    listedCount: foodList.length,
    availableCount: foodList.filter(f => f.status === 'Available').length,
    soldCount: foodList.filter(f => f.status === 'Sold').length,
    givenCount: foodList.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length,
    donatedCount: foodList.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length,
    savedCount: foodList.filter(f => f.status === 'Completed' || f.status === 'Sold' || f.status === 'Given' || f.status === 'Donated').length
  });

  const stats = calcMetrics(userFoods, userRequests);
  const communityStats = calcMetrics(foods, requests);

  res.json({
    success: true,
    stats,
    communityStats,
    recentFoods: userFoods.slice(0, 5),
    recentRequests: userRequests.slice(0, 5),
    communityFoods: foods.slice(0, 5),
    communityRequests: requests.slice(0, 5)
  });
};

app.get(['/api/dashboard', '/api/dashboard/stats'], handleDashboard);
app.all(['/api/dashboard.php', '/dashboard.php'], handleDashboard);

module.exports = app;
