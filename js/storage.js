// Food2Smile - Client Storage Manager (localStorage)
// Web Technologies College Project

const STORAGE = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  FOODS: 'foods',
  REQUESTS: 'requests'
};

function loadJSON(key, defaultVal = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (err) {
    console.warn(`Storage read error for key [${key}]:`, err);
    return defaultVal;
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Storage write error for key [${key}]:`, err);
  }
}

// User helper API
function getUsers() { return loadJSON(STORAGE.USERS, []); }
function saveUsers(users) { saveJSON(STORAGE.USERS, users); }

function getCurrentUser() { return loadJSON(STORAGE.CURRENT_USER, null); }
function setCurrentUser(user) { saveJSON(STORAGE.CURRENT_USER, user); }

// Foods helper API
function getFoods() {
  purgeExpiredListings();
  return loadJSON(STORAGE.FOODS, []);
}
function saveFoods(foods) { saveJSON(STORAGE.FOODS, foods); }

// Requests helper API
function getRequests() { return loadJSON(STORAGE.REQUESTS, []); }
function saveRequests(requests) { saveJSON(STORAGE.REQUESTS, requests); }

// Purge expired listings automatically before rendering
function purgeExpiredListings() {
  const foods = loadJSON(STORAGE.FOODS, null);
  if (!foods || !Array.isArray(foods)) return;

  const todayStr = new Date().toISOString().split('T')[0];
  let changed = false;

  const updated = foods.map(food => {
    if (food.status === 'Available' && food.spoilingDate && food.spoilingDate < todayStr) {
      changed = true;
      return { ...food, status: 'Expired' };
    }
    return food;
  });

  if (changed) {
    saveJSON(STORAGE.FOODS, updated);
  }
}

// Seed demo listings on first run
function initializeDemoData() {
  const existing = localStorage.getItem(STORAGE.FOODS);
  if (!existing || JSON.parse(existing).length === 0) {
    const today = new Date();
    
    const d1 = new Date(today); d1.setDate(today.getDate() + 1);
    const d2 = new Date(today); d2.setDate(today.getDate() + 2);
    const d4 = new Date(today); d4.setDate(today.getDate() + 4);

    const fmt = (d) => d.toISOString().split('T')[0];

    const demoUser1 = { id: 'u-101', name: 'FunPanda', phone: '9876543210' };
    const demoUser2 = { id: 'u-102', name: 'Priya Verma', phone: '9123456789' };

    const initialFoods = [
      {
        id: 101,
        ownerId: demoUser1.id,
        ownerName: demoUser1.name,
        name: 'Fresh Farm Tomatoes',
        category: 'Vegetables',
        quantity: '2 kg',
        location: 'Hostel Block B, Room 204',
        originalPrice: 100,
        action: 'Discount',
        discount: 30,
        finalPrice: 70,
        deliveryOption: 'Self Pickup',
        spoilingDate: fmt(d2),
        status: 'Available',
        createdAt: new Date().toISOString()
      },
      {
        id: 102,
        ownerId: demoUser1.id,
        ownerName: demoUser1.name,
        name: 'Devgad Alphonso Mangoes',
        category: 'Fruits',
        quantity: '1 dozen',
        location: 'Sector 14 Apartments',
        originalPrice: 120,
        action: 'Free',
        discount: 0,
        finalPrice: 0,
        deliveryOption: 'Self Pickup',
        spoilingDate: fmt(d1),
        status: 'Available',
        createdAt: new Date().toISOString()
      },
      {
        id: 103,
        ownerId: demoUser2.id,
        ownerName: demoUser2.name,
        name: 'Paneer Butter Masala & Rotis',
        category: 'Cooked Food',
        quantity: '2 tiffins',
        location: 'Campus Mess Gate 2',
        originalPrice: 150,
        action: 'Donate',
        discount: 0,
        finalPrice: 0,
        deliveryOption: 'Self Pickup',
        spoilingDate: fmt(today),
        status: 'Available',
        createdAt: new Date().toISOString()
      },
      {
        id: 104,
        ownerId: demoUser2.id,
        ownerName: demoUser2.name,
        name: 'Britannia Whole Wheat Bread Pack',
        category: 'Bakery',
        quantity: '1 unopened pack',
        location: 'Green Glen Residency',
        originalPrice: 50,
        action: 'Sell',
        discount: 0,
        finalPrice: 50,
        deliveryOption: 'Delivery',
        spoilingDate: fmt(d4),
        status: 'Available',
        createdAt: new Date().toISOString()
      }
    ];

    saveJSON(STORAGE.FOODS, initialFoods);

    const users = loadJSON(STORAGE.USERS, []);
    if (users.length === 0) {
      saveJSON(STORAGE.USERS, [
        { id: demoUser1.id, name: demoUser1.name, phone: demoUser1.phone, password: 'password123' },
        { id: demoUser2.id, name: demoUser2.name, phone: demoUser2.phone, password: 'password123' }
      ]);
    }
  }
}

// Auto-run initialization check
initializeDemoData();
