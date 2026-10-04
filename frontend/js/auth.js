/**
 * Food2Smile - Auth Module (auth.js)
 * REST API Auth Integration with JWT token persistence and session navbar renderer.
 */

function isLoggedIn() {
  return getToken() !== null;
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) localStorage.setItem('currentUser', JSON.stringify(user));
  else localStorage.removeItem('currentUser');
}

// Global mode state: 'phone' or 'email'
let currentLoginMode = 'phone';

function switchLoginMode(mode) {
  currentLoginMode = mode;
  const phoneBtn = document.getElementById('tabPhoneBtn');
  const emailBtn = document.getElementById('tabEmailBtn');
  const phoneGroup = document.getElementById('phoneInputGroup');
  const emailGroup = document.getElementById('emailInputGroup');

  if (!phoneBtn || !emailBtn) return;

  if (mode === 'phone') {
    phoneBtn.classList.add('active');
    emailBtn.classList.remove('active');
    phoneGroup.classList.remove('d-none');
    emailGroup.classList.add('d-none');
  } else {
    emailBtn.classList.add('active');
    phoneBtn.classList.remove('active');
    emailGroup.classList.remove('d-none');
    phoneGroup.classList.add('d-none');
  }
}

function togglePasswordVisibility(fieldId, btnEl) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  if (field.type === 'password') {
    field.type = 'text';
    btnEl.innerHTML = '<i class="bi bi-eye-slash text-success"></i>';
  } else {
    field.type = 'password';
    btnEl.innerHTML = '<i class="bi bi-eye"></i>';
  }
}

function quickFillDemo(type) {
  const passField = document.getElementById('loginPassword');
  if (passField) passField.value = 'password123';

  if (type === 'phone') {
    switchLoginMode('phone');
    const phoneInput = document.getElementById('loginPhoneInput');
    if (phoneInput) phoneInput.value = '9876543210';
  } else {
    switchLoginMode('email');
    const emailInput = document.getElementById('loginEmailInput');
    if (emailInput) emailInput.value = 'funpanda06@gmail.com';
  }
}

function showAuthAlert(message, type = 'danger') {
  const alertEl = document.getElementById('authAlert');
  if (!alertEl) return;

  alertEl.className = `alert alert-${type} py-2 px-3 small rounded-3 mb-3`;
  alertEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> ${message}`;
  alertEl.classList.remove('d-none');
}

function hideAuthAlert() {
  const alertEl = document.getElementById('authAlert');
  if (alertEl) alertEl.classList.add('d-none');
}

async function registerUser(name, phoneOrEmail, password) {
  try {
    const isEmail = phoneOrEmail.includes('@');
    const payload = {
      name: name.trim(),
      email: isEmail ? phoneOrEmail.trim() : undefined,
      phone: !isEmail ? phoneOrEmail.trim() : undefined,
      password: password
    };

    const res = await API.post('/auth/register', payload);
    if (res.success) {
      setToken(res.token);
      setCurrentUser(res.user);
      return { success: true, message: res.message || 'Registration successful!' };
    }
    return { success: false, message: res.message || 'Registration failed' };
  } catch (err) {
    return { success: false, message: err.message || 'Registration failed' };
  }
}

async function loginUser(identifier, password) {
  try {
    const isEmail = identifier.includes('@');
    const payload = {
      email: isEmail ? identifier.trim() : undefined,
      phone: !isEmail ? identifier.trim() : undefined,
      password: password
    };

    const res = await API.post('/auth/login', payload);
    if (res.success) {
      setToken(res.token);
      setCurrentUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, message: res.message || 'Login failed' };
  } catch (err) {
    return { success: false, message: err.message || 'Invalid credentials' };
  }
}

function logoutUser() {
  removeToken();
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!isLoggedIn()) {
    alert('Please log in to access this page.');
    window.location.href = 'login.html';
  }
}

function renderNavbarUser() {
  const container = document.getElementById('navbarAuthSection');
  if (!container) return;

  const user = getCurrentUser();

  if (user && isLoggedIn()) {
    const initials = (user.name || 'User').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <span class="user-avatar-pill" title="${user.name}">${initials}</span>
        <span class="text-white fw-bold d-none d-md-inline ms-1 me-2">${user.name}</span>
        <button onclick="logoutUser()" class="btn btn-sm btn-outline-light rounded-2 px-3">
          Logout
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <a href="login.html" class="btn btn-sm btn-outline-light rounded-2 px-3">Login</a>
        <a href="register.html" class="btn btn-sm btn-green px-3">Register</a>
      </div>
    `;
  }
}

// Bind Form Listeners
document.addEventListener('DOMContentLoaded', () => {
  renderNavbarUser();

  // Handle Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAuthAlert();

      let identifier = '';
      if (currentLoginMode === 'phone') {
        identifier = (document.getElementById('loginPhoneInput')?.value || '').trim();
      } else {
        identifier = (document.getElementById('loginEmailInput')?.value || '').trim();
      }

      const password = (document.getElementById('loginPassword')?.value || '').trim();

      if (!identifier) {
        showAuthAlert(`Please enter your ${currentLoginMode === 'phone' ? 'mobile phone number' : 'email address'}.`);
        return;
      }
      if (!password) {
        showAuthAlert('Please enter your password.');
        return;
      }

      const submitBtn = document.getElementById('loginSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Logging in...';
      }

      const result = await loginUser(identifier, password);

      if (result.success) {
        showAuthAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Log In</span> <i class="bi bi-arrow-right"></i>';
        }
        showAuthAlert(result.message || 'Invalid login credentials. Please try again.');
      }
    });
  }

  // Handle Register Form
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAuthAlert();

      const name = (document.getElementById('regName')?.value || '').trim();
      const phone = (document.getElementById('regPhone')?.value || '').trim();
      const password = (document.getElementById('regPassword')?.value || '').trim();
      const confirmPassword = (document.getElementById('regConfirmPassword')?.value || '').trim();

      if (!name) {
        showAuthAlert('Please enter your full name.');
        return;
      }
      if (!phone) {
        showAuthAlert('Please enter your mobile phone number.');
        return;
      }
      if (!password || password.length < 6) {
        showAuthAlert('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        showAuthAlert('Passwords do not match. Please check and try again.');
        return;
      }

      const submitBtn = document.getElementById('regSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Creating account...';
      }

      const result = await registerUser(name, phone, password);

      if (result.success) {
        showAuthAlert('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Register Account</span> <i class="bi bi-check-circle"></i>';
        }
        showAuthAlert(result.message || 'Registration failed. Please try again.');
      }
    });
  }
});
