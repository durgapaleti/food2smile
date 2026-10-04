/**
 * Food2Smile - PHP API Fetch Wrapper (api.js)
 * Interacts with PHP REST endpoints (api/auth.php, api/foods.php, api/requests.php, api/dashboard.php)
 */

const API_BASE_URL = 'api';

const API = {
  async get(endpoint) {
    let url = `${API_BASE_URL}${endpoint}`;
    if (endpoint.startsWith('/auth/')) {
      url = `${API_BASE_URL}/auth.php?action=${endpoint.replace('/auth/', '')}`;
    } else if (endpoint.startsWith('/foods/my')) {
      url = `${API_BASE_URL}/foods.php?action=my`;
    } else if (endpoint.startsWith('/foods/')) {
      url = `${API_BASE_URL}/foods.php?id=${endpoint.replace('/foods/', '')}`;
    } else if (endpoint.startsWith('/foods?')) {
      url = `${API_BASE_URL}/foods.php?${endpoint.replace('/foods?', '')}`;
    } else if (endpoint === '/foods') {
      url = `${API_BASE_URL}/foods.php`;
    } else if (endpoint.startsWith('/requests/my')) {
      url = `${API_BASE_URL}/requests.php?action=my`;
    } else if (endpoint.startsWith('/requests/received')) {
      url = `${API_BASE_URL}/requests.php?action=received`;
    } else if (endpoint.startsWith('/dashboard/stats')) {
      url = `${API_BASE_URL}/dashboard.php`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      return await response.json();
    } catch (err) {
      console.error(`API GET error (${url}):`, err);
      return { success: false, message: 'Network error or PHP server offline' };
    }
  },

  async post(endpoint, data = {}) {
    let url = `${API_BASE_URL}${endpoint}`;
    if (endpoint === '/auth/register') {
      url = `${API_BASE_URL}/auth.php?action=register`;
    } else if (endpoint === '/auth/login') {
      url = `${API_BASE_URL}/auth.php?action=login`;
    } else if (endpoint === '/auth/logout') {
      url = `${API_BASE_URL}/auth.php?action=logout`;
    } else if (endpoint === '/foods') {
      url = `${API_BASE_URL}/foods.php`;
    } else if (endpoint === '/requests') {
      url = `${API_BASE_URL}/requests.php`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (err) {
      console.error(`API POST error (${url}):`, err);
      return { success: false, message: 'Network error or PHP server offline' };
    }
  },

  async put(endpoint, data = {}) {
    let url = `${API_BASE_URL}${endpoint}`;
    if (endpoint.includes('/accept')) {
      const id = endpoint.match(/\/requests\/(\d+)\/accept/)[1];
      url = `${API_BASE_URL}/requests.php?action=accept&id=${id}`;
    } else if (endpoint.includes('/reject')) {
      const id = endpoint.match(/\/requests\/(\d+)\/reject/)[1];
      url = `${API_BASE_URL}/requests.php?action=reject&id=${id}`;
    } else if (endpoint.includes('/complete')) {
      const id = endpoint.match(/\/requests\/(\d+)\/complete/)[1];
      url = `${API_BASE_URL}/requests.php?action=complete&id=${id}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (err) {
      console.error(`API PUT error (${url}):`, err);
      return { success: false, message: 'Network error' };
    }
  },

  async delete(endpoint) {
    let url = `${API_BASE_URL}${endpoint}`;
    if (endpoint.startsWith('/foods/')) {
      const id = endpoint.replace('/foods/', '');
      url = `${API_BASE_URL}/foods.php?action=delete&id=${id}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      return await response.json();
    } catch (err) {
      console.error(`API DELETE error (${url}):`, err);
      return { success: false, message: 'Network error' };
    }
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
