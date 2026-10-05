/**
 * Food2Smile - Hybrid API Adapter (js/api.js)
 * High-reliability REST & Offline Engine Adapter.
 * Attempts server endpoints first, automatically falling back to client storage 
 * to guarantee 100% feature availability on static hosts (Vercel, GitHub Pages) and XAMPP/Node servers.
 */

const API_BASE_URL = 'api';
const FIREBASE_URL_KEY = 'food2smile_firebase_url';

function getFirebaseDbUrl() {
  return window.FOOD2SMILE_FIREBASE_URL || localStorage.getItem(FIREBASE_URL_KEY) || 'https://food2smile-9ea0b-default-rtdb.firebaseio.com';
}

function setFirebaseDbUrl(url) {
  if (url) localStorage.setItem(FIREBASE_URL_KEY, url.trim().replace(/\/$/, ''));
  else localStorage.removeItem(FIREBASE_URL_KEY);
}

function getDeletedFoodIds() {
  try {
    const raw = localStorage.getItem('food2smile_deleted_ids');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addDeletedFoodId(id) {
  if (!id) return;
  try {
    const ids = getDeletedFoodIds();
    const strId = String(id);
    if (!ids.includes(strId)) {
      ids.push(strId);
      localStorage.setItem('food2smile_deleted_ids', JSON.stringify(ids));
    }
  } catch (e) {}
}

function filterOutDeletedFoods(foods) {
  if (!Array.isArray(foods)) return [];
  const deletedIds = getDeletedFoodIds();
  if (deletedIds.length === 0) return foods;
  return foods.filter(f => {
    const idStr = String(f.id || f._id || '');
    return !deletedIds.includes(idStr);
  });
}

const FirebaseEngine = {
  async get(endpoint) {
    const baseUrl = getFirebaseDbUrl();
    if (!baseUrl) return null;

    try {
      if (endpoint.startsWith('/foods')) {
        const res = await fetch(`${baseUrl}/foods.json`);
        if (res.ok) {
          const raw = await res.json();
          let foods = raw ? Object.values(raw) : [];
          foods = filterOutDeletedFoods(foods);

          if (endpoint.includes('?')) {
            const params = new URLSearchParams(endpoint.split('?')[1]);
            const sort = params.get('sort');
            const category = params.get('category');
            const action = params.get('action');
            const search = params.get('search');
            const userId = params.get('userId');
            const userName = params.get('userName');

            if (action === 'my' && (userId || userName)) {
              const uId = userId ? String(userId).trim() : '';
              const uName = userName ? String(userName).trim().toLowerCase() : '';
              foods = foods.filter(f => (uId && (f.owner_id === uId || f.ownerId === uId)) || (uName && ((f.owner_name && f.owner_name.toLowerCase().includes(uName)) || (f.ownerName && f.ownerName.toLowerCase().includes(uName)))));
              return { success: true, foods };
            }

            foods = foods.filter(f => f.status === 'Available');

            if (category && category !== 'All') foods = foods.filter(f => f.category === category);
            if (action && action !== 'All') foods = foods.filter(f => f.action === action);
            if (search) {
              const q = search.toLowerCase();
              foods = foods.filter(f => (f.name && f.name.toLowerCase().includes(q)) || (f.category && f.category.toLowerCase().includes(q)) || (f.location && f.location.toLowerCase().includes(q)));
            }

            if (sort === 'price-low') foods.sort((a, b) => (a.finalPrice || a.final_price || 0) - (b.finalPrice || b.final_price || 0));
            else if (sort === 'price-high') foods.sort((a, b) => (b.finalPrice || b.final_price || 0) - (a.finalPrice || a.final_price || 0));
            else if (sort === 'spoiling-soon') foods.sort((a, b) => new Date(a.spoilingDate || a.spoiling_date || 0) - new Date(b.spoilingDate || b.spoiling_date || 0));
            else foods.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
          }

          return { success: true, foods };
        }
      }

      if (endpoint.startsWith('/requests')) {
        const res = await fetch(`${baseUrl}/requests.json`);
        if (res.ok) {
          const raw = await res.json();
          let requests = raw ? Object.values(raw) : [];

          if (endpoint.includes('?')) {
            const params = new URLSearchParams(endpoint.split('?')[1]);
            const action = params.get('action');
            const userId = params.get('userId');
            const userName = params.get('userName');

            const uId = userId ? String(userId).trim() : '';
            const uName = userName ? String(userName).trim().toLowerCase() : '';

            if (action === 'my' && (uId || uName)) {
              requests = requests.filter(r => (uId && (r.requesterId === uId || r.requester_id === uId)) || (uName && ((r.requesterName && r.requesterName.toLowerCase().includes(uName)) || (r.requester_name && r.requester_name.toLowerCase().includes(uName)))));
            } else if (action === 'received') {
              requests = requests.filter(r => (uId && (r.ownerId === uId || r.owner_id === uId)) || (uName && ((r.ownerName && r.ownerName.toLowerCase().includes(uName)) || (r.owner_name && r.owner_name.toLowerCase().includes(uName)))) || !r.owner_id || r.owner_id === 'u-101');
            }
          }

          return { success: true, requests };
        }
      }

      if (endpoint.startsWith('/dashboard')) {
        const foodsRes = await fetch(`${baseUrl}/foods.json`);
        const reqsRes = await fetch(`${baseUrl}/requests.json`);
        const foodsRaw = foodsRes.ok ? await foodsRes.json() : null;
        const reqsRaw = reqsRes.ok ? await reqsRes.json() : null;

        const foods = foodsRaw ? Object.values(foodsRaw) : [];
        const requests = reqsRaw ? Object.values(reqsRaw) : [];

        const stats = {
          totalListed: foods.length,
          listedCount: foods.length,
          availableCount: foods.filter(f => f.status === 'Available').length,
          soldCount: foods.filter(f => f.status === 'Sold').length,
          givenCount: foods.filter(f => f.status === 'Given' || (f.action === 'Free' && f.status === 'Completed')).length,
          donatedCount: foods.filter(f => f.status === 'Donated' || (f.action === 'Donate' && f.status === 'Completed')).length,
          savedCount: foods.filter(f => f.status === 'Completed' || f.status === 'Sold' || f.status === 'Given' || f.status === 'Donated').length,
          recentFoods: foods.slice(0, 5),
          recentRequests: requests.slice(0, 5)
        };

        return { success: true, stats, communityStats: stats, recentFoods: foods.slice(0, 5), recentRequests: requests.slice(0, 5) };
      }
    } catch (err) {}
    return null;
  },

  async post(endpoint, data) {
    const baseUrl = getFirebaseDbUrl();
    if (!baseUrl) return null;

    try {
      if (endpoint === '/foods') {
        const user = safeGetCurrentUser();
        const id = data.id || Date.now();
        const newFood = {
          id,
          owner_id: data.ownerId || (user ? user.id : 'u-101'),
          ownerId: data.ownerId || (user ? user.id : 'u-101'),
          owner_name: data.ownerName || (user ? user.name : 'durga'),
          ownerName: data.ownerName || (user ? user.name : 'durga'),
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          location: data.location || 'Local Pickup',
          originalPrice: data.originalPrice || 0,
          original_price: data.originalPrice || 0,
          action: data.action,
          discount: data.discount || 0,
          finalPrice: data.finalPrice || 0,
          final_price: data.finalPrice || 0,
          deliveryOption: data.deliveryOption || 'Self Pickup',
          delivery_option: data.deliveryOption || 'Self Pickup',
          spoilingDate: data.spoilingDate,
          spoiling_date: data.spoilingDate,
          image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
          status: 'Available',
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        await fetch(`${baseUrl}/foods/${id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFood)
        });

        LocalEngine.post('/foods', newFood);
        return { success: true, message: 'Surplus food listed successfully!', food: newFood };
      }

      if (endpoint === '/requests') {
        const user = safeGetCurrentUser();
        const id = Date.now();
        const newReq = {
          id,
          foodId: data.foodId,
          food_id: data.foodId,
          requesterId: data.requesterId || (user ? user.id : 'u-102'),
          requester_id: data.requesterId || (user ? user.id : 'u-102'),
          requesterName: data.requesterName || (user ? user.name : 'Neighbor'),
          requester_name: data.requesterName || (user ? user.name : 'Neighbor'),
          requesterPhone: data.requesterPhone || '9876543210',
          requester_phone: data.requesterPhone || '9876543210',
          ownerId: data.ownerId || 'u-101',
          owner_id: data.ownerId || 'u-101',
          ownerName: data.ownerName || 'durga',
          owner_name: data.ownerName || 'durga',
          status: 'Pending',
          createdAt: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString().split('T')[0]
        };

        await fetch(`${baseUrl}/requests/${id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReq)
        });

        LocalEngine.post('/requests', newReq);
        return { success: true, message: 'Food request sent to owner!', request: newReq };
      }

      if (endpoint === '/requests/action') {
        const { id, action } = data;
        let newStatus = 'Pending';
        if (action === 'accept') newStatus = 'Accepted';
        if (action === 'reject') newStatus = 'Rejected';
        if (action === 'complete') newStatus = 'Completed';

        await fetch(`${baseUrl}/requests/${id}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        LocalEngine.put(`/requests/${id}/${action}`, data);
        return { success: true, message: `Request status updated to ${newStatus}.` };
      }
    } catch (err) {}
    return null;
  },

  async delete(endpoint) {
    const baseUrl = getFirebaseDbUrl();
    if (!baseUrl) return null;

    try {
      if (endpoint.startsWith('/foods/')) {
        const id = endpoint.replace('/foods/', '');
        addDeletedFoodId(id);
        await fetch(`${baseUrl}/foods/${id}.json`, {
          method: 'DELETE'
        });
        LocalEngine.delete(endpoint);
        return { success: true, message: 'Listing deleted from Firebase.' };
      }
      if (endpoint.startsWith('/requests/')) {
        const id = endpoint.replace('/requests/', '');
        await fetch(`${baseUrl}/requests/${id}.json`, {
          method: 'DELETE'
        });
        LocalEngine.delete(endpoint);
        return { success: true, message: 'Request deleted from Firebase.' };
      }
    } catch (err) {}
    return null;
  }
};

const API = {
  async get(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // 0. Try Firebase Realtime Database first if configured
    const fbRes = await FirebaseEngine.get(cleanEndpoint);
    if (fbRes) {
      if (cleanEndpoint.startsWith('/foods') && fbRes.foods) {
        fbRes.foods = filterOutDeletedFoods(fbRes.foods);
      }
      return fbRes;
    }

    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;
    
    // 1. Try Vercel / Node REST endpoint
    try {
      const response = await fetch(primaryUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          if (cleanEndpoint.startsWith('/foods') && data.foods && Array.isArray(data.foods)) {
            const localRes = LocalEngine.get(cleanEndpoint);
            const localFoods = (localRes && localRes.foods) || [];
            const combinedMap = new Map();
            (localFoods || []).forEach(f => combinedMap.set(String(f.id || f._id), f));
            (data.foods || []).forEach(f => combinedMap.set(String(f.id || f._id), f));
            const mergedFoods = filterOutDeletedFoods(Array.from(combinedMap.values()));
            return { success: true, foods: mergedFoods };
          }
          return data;
        }
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

    // 0. Try Firebase Realtime Database first if configured
    const fbRes = await FirebaseEngine.post(cleanEndpoint, data);
    if (fbRes) return fbRes;

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

    const fbRes = await FirebaseEngine.post(cleanEndpoint, data);
    if (fbRes) return fbRes;

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

    if (cleanEndpoint.startsWith('/foods/')) {
      const id = cleanEndpoint.replace('/foods/', '');
      addDeletedFoodId(id);
    }

    const fbRes = await FirebaseEngine.delete(cleanEndpoint);
    LocalEngine.delete(cleanEndpoint);

    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(primaryUrl, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object') return fbRes || result;
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
        if (result && typeof result === 'object') return fbRes || result;
      }
    } catch (err) {}

    return fbRes || LocalEngine.delete(endpoint);
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
        { id: 'u-101', name: 'durga', phone: '9912351770', password: 'password123' },
        { id: 'u-102', name: 'Priya Verma', phone: '9876543211', password: 'password123' }
      ]);
    }

    const existingReqs = localStorage.getItem('requests');
    if (!existingReqs || JSON.parse(existingReqs).length === 0) {
      const initialRequests = [
        {
          id: 201,
          foodId: 101,
          food_id: 101,
          foodName: 'Fresh Organic Tomatoes',
          food_name: 'Fresh Organic Tomatoes',
          category: 'Vegetables',
          action: 'Free',
          price: 0,
          requesterId: 'u-102',
          requester_id: 'u-102',
          requesterName: 'Priya Verma',
          requester_name: 'Priya Verma',
          requesterPhone: '9876543211',
          requester_phone: '9876543211',
          ownerId: 'u-101',
          owner_id: 'u-101',
          ownerName: 'durga',
          owner_name: 'durga',
          status: 'Pending',
          createdAt: new Date().toISOString().split('T')[0]
        }
      ];
      safeSaveJSON('requests', initialRequests);
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
      foods = filterOutDeletedFoods(foods);

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
        const sent = allRequests.filter(r => 
          (currentUser && (r.requesterId === currentUser.id || r.requester_id === currentUser.id)) ||
          (currentUser && currentUser.name && ((r.requesterName && r.requesterName.toLowerCase().includes(currentUser.name.toLowerCase())) || (r.requester_name && r.requester_name.toLowerCase().includes(currentUser.name.toLowerCase()))))
        );
        return { success: true, requests: sent };
      }
      if (endpoint.includes('action=received')) {
        const incoming = allRequests.filter(r => 
          !r.owner_id || r.owner_id === 'u-101' || r.ownerId === 'u-101' ||
          (currentUser && (r.ownerId === currentUser.id || r.owner_id === currentUser.id)) ||
          (currentUser && currentUser.name && ((r.ownerName && r.ownerName.toLowerCase().includes(currentUser.name.toLowerCase())) || (r.owner_name && r.owner_name.toLowerCase().includes(currentUser.name.toLowerCase()))))
        );
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
      addDeletedFoodId(id);
      let foods = safeGetFoods();
      foods = foods.filter(f => String(f.id) !== String(id) && String(f._id) !== String(id));
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
