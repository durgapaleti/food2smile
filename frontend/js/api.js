/**
 * Food2Smile - REST API Client Engine (api.js)
 * Wraps browser fetch() requests with JWT Authorization headers and JSON error handling.
 */

const API_BASE = '/api';

// Token Management
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

function removeToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

// Universal API Fetcher
async function apiFetch(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {};
  const token = getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : null)
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}

// REST helper functions
const API = {
  get: (endpoint) => apiFetch(endpoint, 'GET'),
  post: (endpoint, body, isFormData = false) => apiFetch(endpoint, 'POST', body, isFormData),
  put: (endpoint, body, isFormData = false) => apiFetch(endpoint, 'PUT', body, isFormData),
  delete: (endpoint) => apiFetch(endpoint, 'DELETE')
};
