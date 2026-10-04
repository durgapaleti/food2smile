const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

class InMemoryStore {
  constructor() {
    this.users = [];
    this.foods = [];
    this.requests = [];
    this.initialized = false;
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  saveToDisk() {
    try {
      this.ensureDataDir();
      const data = {
        users: this.users,
        foods: this.foods,
        requests: this.requests
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn('⚠️ Disk persistence write error:', err.message);
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.users.length > 0) {
          this.users = parsed.users;
          this.foods = parsed.foods || [];
          this.requests = parsed.requests || [];
          console.log(`💾 Loaded ${this.users.length} users and ${this.foods.length} foods from local disk storage!`);
          return true;
        }
      }
    } catch (err) {
      console.warn('⚠️ Disk persistence load error:', err.message);
    }
    return false;
  }

  async init() {
    if (this.initialized) return;

    if (this.loadFromDisk()) {
      this.initialized = true;
      return;
    }

    console.log('🌱 Generating default demo users & initial foods...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const u1 = {
      _id: 'usr_001',
      name: 'Ananya Sharma',
      email: 'funpanda06@gmail.com',
      phone: '9876543210',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date()
    };

    const u2 = {
      _id: 'usr_002',
      name: 'Priya Verma',
      email: 'priya@gmail.com',
      phone: '9876543211',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date()
    };

    this.users.push(u1, u2);

    const today = new Date();
    const addDays = (d) => new Date(today.getTime() + d * 24 * 60 * 60 * 1000);

    this.foods.push(
      {
        _id: 'food_001',
        owner: u1._id,
        ownerName: u1.name,
        name: 'Fresh Organic Tomatoes',
        category: 'Vegetables',
        quantity: '3 kg',
        location: 'Koramangala, Bangalore',
        originalPrice: 120,
        action: 'Free',
        discount: 100,
        finalPrice: 0,
        deliveryOption: 'Self Pickup',
        spoilingDate: addDays(2),
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
        description: 'Harvested yesterday from home garden. Excess quantity before going away on weekend trip.',
        status: 'Available',
        createdAt: new Date()
      },
      {
        _id: 'food_002',
        owner: u2._id,
        ownerName: u2.name,
        name: 'Whole Wheat Fresh Bread',
        category: 'Bakery',
        quantity: '2 Loaves',
        location: 'Indiranagar, Bangalore',
        originalPrice: 90,
        action: 'Discount',
        discount: 50,
        finalPrice: 45,
        deliveryOption: 'Self Pickup',
        spoilingDate: addDays(1),
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        description: 'Freshly baked artisanal whole wheat bread. Best consumed within 2 days.',
        status: 'Available',
        createdAt: new Date()
      },
      {
        _id: 'food_003',
        owner: u1._id,
        ownerName: u1.name,
        name: 'Alphonso Mangoes',
        category: 'Fruits',
        quantity: '5 kg',
        location: 'Whitefield, Bangalore',
        originalPrice: 600,
        action: 'Sell',
        discount: 30,
        finalPrice: 420,
        deliveryOption: 'Home Delivery',
        spoilingDate: addDays(4),
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80',
        description: 'Sweet juicy mangoes straight from Ratnagiri orchard.',
        status: 'Available',
        createdAt: new Date()
      }
    );

    this.saveToDisk();
    this.initialized = true;
    console.log('⚡ InMemoryStore initialized and persisted to store.json!');
  }

  cleanPhone(p) {
    if (!p) return '';
    return String(p).replace(/\D/g, '').slice(-10);
  }

  // Users
  findUserByEmailOrPhone(query) {
    const rawSearch = query.email || query.phone || '';
    const cleanNum = this.cleanPhone(rawSearch);
    const lowerEmail = rawSearch.toLowerCase();

    return this.users.find(u => {
      const uPhoneClean = this.cleanPhone(u.phone);
      const uEmailLower = (u.email || '').toLowerCase();

      if (cleanNum && cleanNum.length >= 10 && uPhoneClean === cleanNum) return true;
      if (lowerEmail && uEmailLower === lowerEmail) return true;
      if (cleanNum && uEmailLower.startsWith(cleanNum)) return true;

      return false;
    });
  }

  findUserById(id) {
    return this.users.find(u => String(u._id) === String(id));
  }

  createUser(userData) {
    const newUser = {
      _id: 'usr_' + Date.now(),
      ...userData,
      phone: userData.phone ? this.cleanPhone(userData.phone) : '',
      createdAt: new Date()
    };
    this.users.push(newUser);
    this.saveToDisk();
    return newUser;
  }

  // Foods
  getFoods(filters = {}) {
    let list = [...this.foods];
    const now = new Date();

    // Auto-update expired items ONLY if spoiling date has passed the end of the day
    list.forEach(f => {
      if (f.spoilingDate) {
        const expDate = new Date(f.spoilingDate);
        expDate.setHours(23, 59, 59, 999);
        if (expDate < now && f.status === 'Available') {
          f.status = 'Expired';
        }
      }
    });

    if (filters.category && filters.category !== 'All') {
      list = list.filter(f => f.category === filters.category);
    }
    if (filters.action && filters.action !== 'All') {
      list = list.filter(f => f.action === filters.action);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.category.toLowerCase().includes(q) || 
        f.location.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    if (filters.owner) {
      list = list.filter(f => String(f.owner) === String(filters.owner));
    }
    if (filters.status) {
      list = list.filter(f => f.status === filters.status);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  findFoodById(id) {
    return this.foods.find(f => String(f._id) === String(id));
  }

  createFood(foodData) {
    const newFood = {
      _id: 'food_' + Date.now(),
      ...foodData,
      status: 'Available',
      createdAt: new Date()
    };
    this.foods.push(newFood);
    this.saveToDisk();
    return newFood;
  }

  updateFood(id, updateData) {
    const food = this.findFoodById(id);
    if (!food) return null;
    Object.assign(food, updateData);
    this.saveToDisk();
    return food;
  }

  deleteFood(id) {
    const index = this.foods.findIndex(f => String(f._id) === String(id));
    if (index !== -1) {
      this.foods.splice(index, 1);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Requests
  createRequest(reqData) {
    const newReq = {
      _id: 'req_' + Date.now(),
      ...reqData,
      status: 'Pending',
      createdAt: new Date()
    };
    this.requests.push(newReq);
    this.saveToDisk();
    return newReq;
  }

  getRequestsForUser(userId) {
    return this.requests.filter(r => 
      String(r.requester) === String(userId) || String(r.owner) === String(userId)
    );
  }

  findRequestById(id) {
    return this.requests.find(r => String(r._id) === String(id));
  }

  updateRequest(id, updateData) {
    const reqItem = this.findRequestById(id);
    if (!reqItem) return null;
    Object.assign(reqItem, updateData);
    this.saveToDisk();
    return reqItem;
  }
}

const store = new InMemoryStore();
store.init();

module.exports = store;
