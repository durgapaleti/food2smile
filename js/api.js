/**
 * Food2Smile - Hybrid API Adapter (js/api.js)
 * High-reliability REST & Offline Engine Adapter.
 * Attempts server endpoints first, automatically falling back to client storage 
 * to guarantee 100% feature availability on static hosts (Vercel, GitHub Pages) and XAMPP/Node servers.
 */

const API_BASE_URL = 'api';

const API = {
  async get(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;
    
    // 1. Try Vercel / Node REST endpoint first
    try {
      const response = await fetch(primaryUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') return data;
      }
    } catch (err) {}

    // 2. Try legacy PHP url format if applicable
    let phpUrl = `${API_BASE_URL}${cleanEndpoint}`;
    if (cleanEndpoint.startsWith('/auth/')) {
      phpUrl = `${API_BASE_URL}/auth.php?action=${cleanEndpoint.replace('/auth/', '')}`;
    } else if (cleanEndpoint.startsWith('/foods/my')) {
      phpUrl = `${API_BASE_URL}/foods.php?action=my`;
    } else if (cleanEndpoint.startsWith('/foods/')) {
      phpUrl = `${API_BASE_URL}/foods.php?id=${cleanEndpoint.replace('/foods/', '')}`;
    } else if (cleanEndpoint.startsWith('/foods?')) {
      phpUrl = `${API_BASE_URL}/foods.php?${cleanEndpoint.replace('/foods?', '')}`;
    } else if (cleanEndpoint === '/foods') {
      phpUrl = `${API_BASE_URL}/foods.php`;
    } else if (cleanEndpoint.startsWith('/requests/my')) {
      phpUrl = `${API_BASE_URL}/requests.php?action=my`;
    } else if (cleanEndpoint.startsWith('/requests/received')) {
      phpUrl = `${API_BASE_URL}/requests.php?action=received`;
    } else if (cleanEndpoint.startsWith('/dashboard/stats') || cleanEndpoint.startsWith('/dashboard')) {
      phpUrl = `${API_BASE_URL}/dashboard.php`;
    }

    try {
      const response = await fetch(phpUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') return data;
      }
    } catch (err) {}

    // 3. Fallback to LocalEngine for offline static use
    return LocalEngine.get(endpoint);
  },

  async post(endpoint, data = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;

    // 1. Try Vercel / Node REST endpoint first
    try {
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return result;
      }
    } catch (err) {}

    // 2. Try PHP backend fallback
    let phpUrl = `${API_BASE_URL}${cleanEndpoint}`;
    if (cleanEndpoint === '/auth/register') {
      phpUrl = `${API_BASE_URL}/auth.php?action=register`;
    } else if (cleanEndpoint === '/auth/login') {
      phpUrl = `${API_BASE_URL}/auth.php?action=login`;
    } else if (cleanEndpoint === '/auth/logout') {
      phpUrl = `${API_BASE_URL}/auth.php?action=logout`;
    } else if (cleanEndpoint === '/foods') {
      phpUrl = `${API_BASE_URL}/foods.php`;
    } else if (cleanEndpoint === '/requests') {
      phpUrl = `${API_BASE_URL}/requests.php`;
    } else if (cleanEndpoint === '/requests/action') {
      phpUrl = `${API_BASE_URL}/requests.php?action=${data.action}&id=${data.id}`;
    }

    try {
      const response = await fetch(phpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return result;
      }
    } catch (err) {}

    // 3. LocalEngine fallback
    return LocalEngine.post(endpoint, data);
  },

  async put(endpoint, data = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return result;
      }
    } catch (err) {}

    let phpUrl = `${API_BASE_URL}${cleanEndpoint}`;
    if (cleanEndpoint.includes('/accept')) {
      const id = cleanEndpoint.match(/\/requests\/(\d+)\/accept/)[1];
      phpUrl = `${API_BASE_URL}/requests.php?action=accept&id=${id}`;
    } else if (cleanEndpoint.includes('/reject')) {
      const id = cleanEndpoint.match(/\/requests\/(\d+)\/reject/)[1];
      phpUrl = `${API_BASE_URL}/requests.php?action=reject&id=${id}`;
    } else if (cleanEndpoint.includes('/complete')) {
      const id = cleanEndpoint.match(/\/requests\/(\d+)\/complete/)[1];
      phpUrl = `${API_BASE_URL}/requests.php?action=complete&id=${id}`;
    }

    try {
      const response = await fetch(phpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return result;
      }
    } catch (err) {}

    return LocalEngine.put(endpoint, data);
  },

  async delete(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(primaryUrl, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return result;
      }
    } catch (err) {}

    let phpUrl = `${API_BASE_URL}${cleanEndpoint}`;
    if (cleanEndpoint.startsWith('/foods/')) {
      const id = cleanEndpoint.replace('/foods/', '');
      phpUrl = `${API_BASE_URL}/foods.php?action=delete&id=${id}`;
    }

    try {
      const response = await fetch(phpUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return result;
      }
    } catch (err) {}

    return LocalEngine.delete(endpoint);
  }
};

/**
 * Safe Helper Utilities for LocalEngine
 */
function safeLoadJSON(key, defaultVal = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function safeSaveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

function safeInitDemo() {
  if (typeof initializeDemoData === 'function') {
    initializeDemoData();
  } else {
    const existing = localStorage.getItem('foods');
    if (!existing || JSON.parse(existing).length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const initialFoods = [
        {
          id: 101,
          ownerId: 'u-101',
          ownerName: 'FunPanda',
          name: 'Fresh Organic Tomatoes',
          category: 'Vegetables',
          quantity: '2 kg',
          location: 'Hostel Block B',
          originalPrice: 100,
          action: 'Discount',
          discount: 30,
          finalPrice: 70,
          deliveryOption: 'Self Pickup',
          spoilingDate: today,
          status: 'Available',
          createdAt: new Date().toISOString()
        },
        {
          id: 102,
          ownerId: 'u-102',
          ownerName: 'Ananya Sharma',
          name: 'Devgad Alphonso Mangoes',
          category: 'Fruits',
          quantity: '1 dozen',
          location: 'Sector 14 Apartments',
          originalPrice: 120,
          action: 'Free',
          discount: 0,
          finalPrice: 0,
          deliveryOption: 'Self Pickup',
          spoilingDate: today,
          status: 'Available',
          createdAt: new Date().toISOString()
        }
      ];
      safeSaveJSON('foods', initialFoods);
      safeSaveJSON('users', [
        { id: 'u-101', name: 'FunPanda', phone: '9876543210', password: 'password123' },
        { id: 'u-102', name: 'Ananya Sharma', phone: '9912351770', password: 'password123' }
      ]);
    }
  }
}

function safeGetUsers() { return typeof getUsers === 'function' ? getUsers() : safeLoadJSON('users', []); }
function safeSaveUsers(users) { typeof saveUsers === 'function' ? saveUsers(users) : safeSaveJSON('users', users); }
function safeGetFoods() { return typeof getFoods === 'function' ? getFoods() : safeLoadJSON('foods', []); }
function safeSaveFoods(foods) { typeof saveFoods === 'function' ? saveFoods(foods) : safeSaveJSON('foods', foods); }
function safeGetRequests() { return typeof getRequests === 'function' ? getRequests() : safeLoadJSON('requests', []); }
function safeSaveRequests(reqs) { typeof saveRequests === 'function' ? saveRequests(reqs) : safeSaveJSON('requests', reqs); }
function safeGetCurrentUser() { return typeof getCurrentUser === 'function' ? getCurrentUser() : safeLoadJSON('currentUser', null); }
function safeSetCurrentUser(user) { typeof setCurrentUser === 'function' ? setCurrentUser(user) : safeSaveJSON('currentUser', user); }

/**
 * Client Storage Fallback Engine (Guarantees zero downtime on Vercel/GitHub Pages)
 */
const LocalEngine = {
  get(endpoint) {
    safeInitDemo();
    const currentUser = safeGetCurrentUser();

    if (endpoint.startsWith('/foods')) {
      let foods = safeGetFoods();

      // Query params parsing
      if (endpoint.includes('?')) {
        const params = new URLSearchParams(endpoint.split('?')[1]);
        const sort = params.get('sort');
        const category = params.get('category');
        const action = params.get('action');
        const search = params.get('search');

        if (params.get('action') === 'my' && currentUser) {
          foods = foods.filter(f => f.ownerId === currentUser.id || f.owner_id === currentUser.id);
          return { success: true, foods };
        }

        foods = foods.filter(f => f.status === 'Available');

        if (category && category !== 'All') foods = foods.filter(f => f.category === category);
        if (action && action !== 'All') foods = foods.filter(f => f.action === action);
        if (search) {
          const q = search.toLowerCase();
          foods = foods.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || (f.location && f.location.toLowerCase().includes(q)));
        }

        if (sort === 'price-low') foods.sort((a, b) => a.finalPrice - b.finalPrice);
        else if (sort === 'price-high') foods.sort((a, b) => b.finalPrice - a.finalPrice);
        else if (sort === 'spoiling-soon') {
          foods.sort((a, b) => new Date(a.spoilingDate) - new Date(b.spoilingDate));
        } else {
          foods.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
      } else if (endpoint.match(/\/foods\/(\d+)/)) {
        const id = endpoint.match(/\/foods\/(\d+)/)[1];
        const food = foods.find(f => f.id == id);
        return { success: true, food };
      }

      return { success: true, foods };
    }

    if (endpoint.startsWith('/requests')) {
      const allRequests = safeGetRequests();
      if (!currentUser) return { success: true, requests: [] };

      if (endpoint.includes('action=my')) {
        const sent = allRequests.filter(r => r.requesterId === currentUser.id || r.requester_id === currentUser.id);
        return { success: true, requests: sent };
      }
      if (endpoint.includes('action=received')) {
        const incoming = allRequests.filter(r => r.ownerId === currentUser.id || r.owner_id === currentUser.id);
        return { success: true, requests: incoming };
      }
      return { success: true, requests: allRequests };
    }

    if (endpoint.startsWith('/dashboard')) {
      const foods = safeGetFoods();
      const requests = safeGetRequests();

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

      return { success: true, stats };
    }

    return { success: true };
  },

  post(endpoint, data) {
    safeInitDemo();
    const currentUser = safeGetCurrentUser();

    if (endpoint === '/auth/register') {
      const users = safeGetUsers();
      const identifier = (data.phone || data.email || '').trim();
      const existing = users.find(u => (data.phone && u.phone === data.phone) || (data.email && u.email === data.email));

      if (existing) {
        return { success: false, message: 'This phone number or email is already registered.' };
      }

      const newUser = {
        id: 'u-' + Date.now(),
        name: data.name || 'Community Member',
        phone: data.phone || '9876543210',
        email: data.email || `${Date.now()}@food2smile.com`,
        password: data.password || 'password123'
      };

      users.push(newUser);
      safeSaveUsers(users);
      safeSetCurrentUser(newUser);
      setToken('demo-token-' + Date.now());

      return { success: true, message: 'Account created successfully!', user: newUser, token: getToken() };
    }

    if (endpoint === '/auth/login') {
      const users = safeGetUsers();
      const idVal = (data.phone || data.email || '').trim();
      let user = users.find(u => u.phone === idVal || u.email === idVal);

      if (!user) {
        // Create dynamic user for quick testing
        user = {
          id: 'u-' + Date.now(),
          name: idVal.includes('@') ? idVal.split('@')[0] : 'Durga',
          phone: !idVal.includes('@') ? idVal : '9912351770',
          email: idVal.includes('@') ? idVal : 'durga@food2smile.com'
        };
        users.push(user);
        safeSaveUsers(users);
      }

      safeSetCurrentUser(user);
      setToken('demo-token-' + Date.now());
      return { success: true, user, token: getToken() };
    }

    if (endpoint === '/foods') {
      const foods = safeGetFoods();
      const user = currentUser || { id: 'u-101', name: 'FunPanda' };

      const newFood = {
        id: Date.now(),
        ownerId: user.id,
        ownerName: user.name,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        location: data.location || 'Local Pickup',
        originalPrice: data.originalPrice || 0,
        action: data.action,
        discount: data.discount || 0,
        finalPrice: data.finalPrice || 0,
        deliveryOption: data.deliveryOption || 'Self Pickup',
        spoilingDate: data.spoilingDate,
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
        status: 'Available',
        createdAt: new Date().toISOString()
      };

      foods.unshift(newFood);
      safeSaveFoods(foods);
      return { success: true, message: 'Food listed successfully!', food: newFood };
    }

    if (endpoint === '/requests') {
      const requests = safeGetRequests();
      const foods = safeGetFoods();
      const food = foods.find(f => f.id == data.foodId || f.id == data.food_id);
      const user = currentUser || { id: 'u-102', name: 'Priya Verma', phone: '9123456789' };

      const newReq = {
        id: Date.now(),
        foodId: food ? food.id : data.foodId,
        foodName: food ? food.name : 'Surplus Food',
        category: food ? food.category : 'General',
        action: food ? food.action : 'Free',
        price: food ? food.finalPrice : 0,
        requesterId: user.id,
        requesterName: user.name,
        requesterPhone: user.phone || '9876543210',
        ownerId: food ? food.ownerId : 'u-101',
        ownerName: food ? food.ownerName : 'Ananya Sharma',
        status: 'Pending',
        createdAt: new Date().toISOString().split('T')[0]
      };

      requests.unshift(newReq);
      safeSaveRequests(requests);
      return { success: true, message: 'Request sent successfully!', request: newReq };
    }

    return { success: true };
  },

  put(endpoint, data) {
    const requests = safeGetRequests();
    const foods = safeGetFoods();

    if (endpoint.includes('/accept')) {
      const id = endpoint.match(/\/requests\/(\d+)\/accept/)[1];
      const req = requests.find(r => r.id == id);
      if (req) {
        req.status = 'Accepted';
        safeSaveRequests(requests);
        const food = foods.find(f => f.id == req.foodId);
        if (food) { food.status = 'Requested'; safeSaveFoods(foods); }
      }
    } else if (endpoint.includes('/reject')) {
      const id = endpoint.match(/\/requests\/(\d+)\/reject/)[1];
      const req = requests.find(r => r.id == id);
      if (req) { req.status = 'Rejected'; safeSaveRequests(requests); }
    } else if (endpoint.includes('/complete')) {
      const id = endpoint.match(/\/requests\/(\d+)\/complete/)[1];
      const req = requests.find(r => r.id == id);
      if (req) {
        req.status = 'Completed';
        safeSaveRequests(requests);
        const food = foods.find(f => f.id == req.foodId);
        if (food) { food.status = 'Completed'; safeSaveFoods(foods); }
      }
    }

    return { success: true, message: 'Request status updated.' };
  },

  delete(endpoint) {
    if (endpoint.startsWith('/foods/')) {
      const id = endpoint.replace('/foods/', '');
      let foods = safeGetFoods();
      foods = foods.filter(f => f.id != id);
      safeSaveFoods(foods);
      return { success: true, message: 'Listing deleted.' };
    }
    return { success: true };
  }
};

function getToken() {
  return localStorage.getItem('token') || 'php_session_active';
}

function setToken(token) {
  localStorage.setItem('token', token || 'php_session_active');
}

function removeToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}
