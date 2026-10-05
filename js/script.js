/**
 * Food2Smile - Master Frontend Application Controller for PHP (script.js)
 * Asynchronous REST API dispatcher and safe DOM event binding for PHP views.
 */

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop() || 'index.php';

  if (path === 'index.html' || path === 'index.php' || path === '') initHomePage();
  if (path === 'share-food.html' || path === 'share-food.php') { requireAuth(); initShareFoodPage(); }
  if (path === 'going-away.html' || path === 'going-away.php') { requireAuth(); initGoingAwayPage(); }
  if (path === 'find-food.html' || path === 'find-food.php') initFindFoodPage();
  if (path === 'food-details.html' || path === 'food-details.php') initFoodDetailsPage();
  if (path === 'my-foods.html' || path === 'my-foods.php') { requireAuth(); initMyFoodsPage(); }
  if (path === 'requests.html' || path === 'requests.php') { requireAuth(); initRequestsPage(); }
  if (path === 'dashboard.html' || path === 'dashboard.php') { requireAuth(); renderDashboardPage(); }
  if (path === 'login.html' || path === 'login.php') initLoginPage();
  if (path === 'register.html' || path === 'register.php') initRegisterPage();
});

// HOMEPAGE LOGIC
async function initHomePage() {
  const previewContainer = document.getElementById('homeFeaturedFoods');
  if (previewContainer) {
    try {
      const res = await API.get('/foods?sort=newest');
      const availableFoods = (res.foods || []).filter(f => f.status === 'Available').slice(0, 3);
      if (availableFoods.length === 0) {
        previewContainer.innerHTML = `
          <div class="col-12 text-center py-4">
            <p class="text-muted fs-5">No active food listings right now. Be the first person to share surplus food!</p>
            <a href="share-food.html" class="btn btn-green">Share Food Now</a>
          </div>
        `;
      } else {
        previewContainer.innerHTML = availableFoods.map(f => renderFoodCardHTML(f)).join('');
      }
    } catch (err) {
      previewContainer.innerHTML = `<div class="col-12 text-center py-4 text-muted">Unable to connect to server.</div>`;
    }
  }
}

// SHARE FOOD FORM LOGIC
function initShareFoodPage() {
  const form = document.getElementById('shareFoodForm');
  const actionRadios = document.querySelectorAll('input[name="foodAction"]');
  const discountSection = document.getElementById('discountSection');
  const freeSection = document.getElementById('freeSection');
  const donateSection = document.getElementById('donateSection');
  const sellSection = document.getElementById('sellSection');
  const originalPriceInput = document.getElementById('originalPrice');
  const discountSelect = document.getElementById('discountSelect');
  const finalPriceDisplay = document.getElementById('calculatedPriceDisplay');
  const spoilingDateInput = document.getElementById('spoilingDate');
  const spoilingWarningAlert = document.getElementById('spoilingWarningAlert');

  if (spoilingDateInput) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    spoilingDateInput.value = defaultDate.toISOString().split('T')[0];
    spoilingDateInput.min = new Date().toISOString().split('T')[0];

    spoilingDateInput.addEventListener('change', () => {
      const dateVal = spoilingDateInput.value;
      if (!dateVal) return;
      const status = getExpiryStatus(dateVal);
      if (spoilingWarningAlert) {
        spoilingWarningAlert.className = `alert alert-${status.daysLeft <= 0 ? 'danger' : (status.daysLeft === 1 ? 'warning' : 'success')} mt-2 py-2 px-3 small`;
        spoilingWarningAlert.innerHTML = `<i class="bi bi-info-circle me-1"></i> ${status.badgeText}`;
        spoilingWarningAlert.classList.remove('d-none');
      }
    });
  }

  actionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      if (discountSection) discountSection.classList.toggle('d-none', val !== 'Discount');
      if (freeSection) freeSection.classList.toggle('d-none', val !== 'Free');
      if (donateSection) donateSection.classList.toggle('d-none', val !== 'Donate');
      if (sellSection) sellSection.classList.toggle('d-none', val === 'Free' || val === 'Donate');
      
      updateCalculatedPrice();
    });
  });

  if (originalPriceInput) originalPriceInput.addEventListener('input', updateCalculatedPrice);
  if (discountSelect) discountSelect.addEventListener('change', updateCalculatedPrice);

  function updateCalculatedPrice() {
    const selectedAction = document.querySelector('input[name="foodAction"]:checked')?.value || 'Sell';
    const origPrice = parseFloat(originalPriceInput?.value) || 0;

    if (selectedAction === 'Free' || selectedAction === 'Donate') {
      if (finalPriceDisplay) finalPriceDisplay.textContent = '₹0 (FREE)';
    } else if (selectedAction === 'Discount') {
      const pct = parseInt(discountSelect?.value) || 30;
      const calc = calculateDiscountPrice(origPrice, pct);
      if (finalPriceDisplay) finalPriceDisplay.textContent = `₹${calc} (${pct}% OFF)`;
    } else {
      if (finalPriceDisplay) finalPriceDisplay.textContent = `₹${origPrice}`;
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('foodName')?.value;
      const category = document.getElementById('foodCategory')?.value;
      const quantity = document.getElementById('foodQuantity')?.value;
      const location = document.getElementById('foodLocation')?.value;
      const spoilingDate = document.getElementById('spoilingDate')?.value;
      const selectedAction = document.querySelector('input[name="foodAction"]:checked')?.value;
      const originalPrice = parseFloat(document.getElementById('originalPrice')?.value) || 0;
      const discountPct = parseInt(document.getElementById('discountSelect')?.value) || 0;
      const deliveryOpt = document.querySelector('input[name="deliveryOption"]:checked')?.value || 'Self Pickup';

      if (!name || !category || !quantity || !spoilingDate || !selectedAction) {
        return alert('Please fill in all required fields.');
      }

      let finalPrice = originalPrice;
      if (selectedAction === 'Free' || selectedAction === 'Donate') {
        finalPrice = 0;
      } else if (selectedAction === 'Discount') {
        finalPrice = calculateDiscountPrice(originalPrice, discountPct);
      }

      const success = await createFoodListing({
        name,
        category,
        quantity,
        location,
        originalPrice,
        action: selectedAction,
        discount: selectedAction === 'Discount' ? discountPct : 0,
        finalPrice,
        deliveryOption: deliveryOpt,
        spoilingDate
      });

      if (success) {
        alert('Your surplus food has been listed successfully!');
        window.location.href = 'find-food.html';
      }
    });
  }
}

// GOING AWAY FORM LOGIC
function initGoingAwayPage() {
  const form = document.getElementById('goingAwayForm');
  const spoilingDateInput = document.getElementById('goingAwaySpoilingDate');
  const warningAlert = document.getElementById('goingAwayWarningAlert');

  if (spoilingDateInput) {
    spoilingDateInput.min = new Date().toISOString().split('T')[0];
    spoilingDateInput.addEventListener('change', () => {
      const status = getExpiryStatus(spoilingDateInput.value);
      if (warningAlert) {
        warningAlert.className = `alert alert-${status.daysLeft <= 0 ? 'danger' : (status.daysLeft === 1 ? 'warning' : 'success')} mt-2 py-2 px-3 small`;
        warningAlert.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> ${status.badgeText}`;
        warningAlert.classList.remove('d-none');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('goingAwayName')?.value;
      const category = document.getElementById('goingAwayCategory')?.value;
      const quantity = document.getElementById('goingAwayQuantity')?.value;
      const location = document.getElementById('goingAwayLocation')?.value;
      const originalPrice = parseFloat(document.getElementById('goingAwayPrice')?.value) || 0;
      const spoilingDate = document.getElementById('goingAwaySpoilingDate')?.value;
      const action = document.querySelector('input[name="goingAwayAction"]:checked')?.value || 'Free';

      if (!name || !category || !quantity || !spoilingDate) {
        return alert('Please fill in required fields.');
      }

      let finalPrice = originalPrice;
      if (action === 'Free' || action === 'Donate') finalPrice = 0;

      const success = await createFoodListing({
        name,
        category,
        quantity,
        location,
        originalPrice,
        action,
        discount: 0,
        finalPrice,
        deliveryOption: 'Self Pickup',
        spoilingDate
      });

      if (success) {
        alert('Food listing saved successfully before your trip!');
        window.location.href = 'find-food.html';
      }
    });
  }
}

// FIND FOOD MARKETPLACE LOGIC
function initFindFoodPage() {
  const foodGrid = document.getElementById('findFoodGrid');
  const searchInput = document.getElementById('searchInput');
  const categoryChips = document.querySelectorAll('.category-chip');
  const actionChips = document.querySelectorAll('.action-chip');
  const sortSelect = document.getElementById('sortSelect');

  let activeCategory = 'All';
  let activeAction = 'All';
  let isFirstLoad = true;

  async function filterAndRender() {
    if (!foodGrid) return;

    if (isFirstLoad) {
      foodGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading food marketplace...</span>
          </div>
        </div>
      `;
    }

    try {
      const query = searchInput?.value.trim() || '';
      const sortVal = sortSelect?.value || 'newest';

      let endpoint = `/foods?sort=${sortVal}`;
      if (activeCategory !== 'All') endpoint += `&category=${encodeURIComponent(activeCategory)}`;
      if (activeAction !== 'All') endpoint += `&action=${encodeURIComponent(activeAction)}`;
      if (query) endpoint += `&search=${encodeURIComponent(query)}`;

      const res = await API.get(endpoint);
      const foods = res.foods || [];

      if (foods.length === 0) {
        foodGrid.innerHTML = `
          <div class="col-12">
            <div class="text-center py-5 bg-white rounded-3 border">
              <i class="bi bi-search fs-1 text-muted"></i>
              <h4 class="fw-bold mt-2">No matching food found</h4>
              <p class="text-muted">Try clearing your search query or offer filter.</p>
              <a href="share-food.html" class="btn btn-green mt-2">Share Food Now</a>
            </div>
          </div>
        `;
        return;
      }

      foodGrid.innerHTML = foods.map(f => renderFoodCardHTML(f)).join('');
    } catch (err) {
      if (isFirstLoad) {
        foodGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted">Failed to load marketplace foods.</div>`;
      }
    } finally {
      isFirstLoad = false;
    }
  }

  if (searchInput) searchInput.addEventListener('input', filterAndRender);

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-category') || 'All';
      filterAndRender();
    });
  });

  actionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      actionChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeAction = chip.getAttribute('data-action') || 'All';
      filterAndRender();
    });
  });

  if (sortSelect) sortSelect.addEventListener('change', filterAndRender);

  filterAndRender();
  // Auto-sync polling every 5 seconds for live multi-user sync across devices
  setInterval(filterAndRender, 5000);
}

// FOOD DETAILS LOGIC
async function initFoodDetailsPage() {
  const container = document.getElementById('foodDetailsContainer');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const foodId = urlParams.get('id');

  if (!foodId) {
    container.innerHTML = `<div class="alert alert-danger text-center my-5">No food ID specified.</div>`;
    return;
  }

  try {
    let food = null;
    const res = await API.get(`/foods/${foodId}`);
    if (res && res.success && res.food) {
      food = res.food;
    }

    if (!food) {
      const allRes = await API.get('/foods');
      const allFoods = (allRes && allRes.foods) || [];
      food = allFoods.find(f => f.id == foodId || f._id == foodId);
    }

    if (!food && typeof LocalEngine !== 'undefined') {
      const localRes = LocalEngine.get('/foods');
      const localFoods = (localRes && localRes.foods) || [];
      food = localFoods.find(f => f.id == foodId || f._id == foodId);
    }

    if (!food) {
      container.innerHTML = `<div class="alert alert-danger text-center my-5">Food listing not found.</div>`;
      return;
    }

    const expiry = getExpiryStatus(food.spoilingDate);
    const currentUser = getCurrentUser();
    const isOwner = currentUser && (currentUser.id === food.owner_id || currentUser.id === food.owner);

    let smartAdviceHTML = '';
    if (isOwner && expiry.daysLeft === 1) {
      smartAdviceHTML = `
        <div class="alert alert-warning border-start border-warning border-4 mt-3">
          <h6 class="fw-bold mb-1"><i class="bi bi-exclamation-triangle me-1"></i> Your food may spoil tomorrow!</h6>
          <p class="small mb-0">Tip: Consider reducing your asking price, giving it for free, or donating it to ensure it gets consumed in time.</p>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="form-card">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span class="badge bg-light text-dark border mb-2"><i class="bi bi-tag me-1"></i>${food.category}</span>
                <h2 class="fw-bold text-dark mb-1">${food.name}</h2>
                <div class="text-muted"><i class="bi bi-geo-alt text-success me-1"></i> ${food.location || 'Local Pickup'}</div>
              </div>
              <span class="badge ${expiry.cssClass} fs-6">${expiry.badgeText}</span>
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="p-3 bg-light rounded-3">
                  <div class="text-muted small">Quantity & Pricing</div>
                  <div class="fs-4 fw-bold text-success">
                    ${food.action === 'Free' ? 'FREE' : (food.action === 'Donate' ? '❤️ DONATION' : '₹' + food.finalPrice)}
                  </div>
                  <div class="small text-muted">Quantity: <strong>${food.quantity}</strong></div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 bg-light rounded-3">
                  <div class="text-muted small">Pickup & Logistics</div>
                  <div class="fw-bold text-dark">${food.deliveryOption}</div>
                  <div class="small text-muted">Listed by: <strong>${food.ownerName || 'Community Member'}</strong></div>
                </div>
              </div>
            </div>

            ${smartAdviceHTML}

            <div class="d-flex gap-2 mt-4">
              ${isOwner ? `
                <button class="btn btn-secondary w-100 py-2.5 rounded-2" disabled>You Own This Listing</button>
              ` : `
                <button id="requestFoodBtn" class="btn btn-green w-100 py-2.5 rounded-2 fs-5">
                  <i class="bi bi-send me-1"></i> Request This Food
                </button>
              `}
              <a href="find-food.html" class="btn btn-outline-secondary px-4 rounded-2">Back</a>
            </div>
          </div>
        </div>
      </div>
    `;

    const requestBtn = document.getElementById('requestFoodBtn');
    if (requestBtn) {
      requestBtn.addEventListener('click', () => {
        sendFoodRequest(food.id);
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger text-center my-5">Failed to load details.</div>`;
  }
}

// REQUESTS PAGE INITIALIZATION
async function initRequestsPage() {
  const incomingContainer = document.getElementById('requestsForMyFoodList');
  const outgoingContainer = document.getElementById('myRequestsList');
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  async function loadRequests() {
    try {
      // 1. Incoming requests for foods listed by current user
      const incomingRes = await API.get(`/requests?action=received&userId=${user.id}&userName=${encodeURIComponent(user.name || '')}`);
      const incomingRequests = incomingRes.requests || [];

      if (incomingContainer) {
        if (incomingRequests.length === 0) {
          incomingContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
              <i class="bi bi-inbox fs-2 d-block mb-2"></i>
              No incoming requests for your shared food yet.
            </div>
          `;
        } else {
          incomingContainer.innerHTML = incomingRequests.map(r => `
            <div class="card mb-3 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 class="fw-bold text-dark mb-1">${r.foodName || r.food_name || 'Surplus Food'}</h5>
                    <span class="badge bg-light text-dark border me-1">${r.category || 'General'}</span>
                    <span class="badge ${r.action === 'Free' ? 'bg-success' : 'bg-primary'}">${r.action === 'Free' ? 'FREE' : '₹' + (r.price || 0)}</span>
                  </div>
                  <span class="badge ${r.status === 'Accepted' ? 'bg-info text-dark' : (r.status === 'Completed' ? 'bg-success' : (r.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'))}">
                    ${r.status}
                  </span>
                </div>
                <p class="small text-muted mb-2">
                  Requested by: <strong>${r.requesterName || r.requester_name || 'Neighbor'}</strong> 
                  (${r.requesterPhone || r.requester_phone || '9876543210'})
                </p>

                ${r.status === 'Pending' ? `
                  <div class="d-flex gap-2 mt-3">
                    <button onclick="handleAcceptRequest(${r.id})" class="btn btn-sm btn-green px-3">
                      <i class="bi bi-check-circle me-1"></i> Accept Request
                    </button>
                    <button onclick="handleRejectRequest(${r.id})" class="btn btn-sm btn-outline-danger px-3">
                      <i class="bi bi-x-circle me-1"></i> Reject
                    </button>
                  </div>
                ` : (r.status === 'Accepted' ? `
                  <div class="d-flex gap-2 mt-3 align-items-center">
                    <button onclick="handleCompleteRequest(${r.id})" class="btn btn-sm btn-success px-3">
                      <i class="bi bi-check-all me-1"></i> Mark Completed
                    </button>
                    <a href="tel:${r.requesterPhone || '9876543210'}" class="btn btn-sm btn-outline-primary px-3">
                      <i class="bi bi-telephone me-1"></i> Call Requester
                    </a>
                  </div>
                ` : ``)}
              </div>
            </div>
          `).join('');
        }
      }

      // 2. Outgoing requests sent by current user
      const outgoingRes = await API.get(`/requests?action=my&userId=${user.id}&userName=${encodeURIComponent(user.name || '')}`);
      const outgoingRequests = outgoingRes.requests || [];

      if (outgoingContainer) {
        if (outgoingRequests.length === 0) {
          outgoingContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
              <i class="bi bi-send fs-2 d-block mb-2"></i>
              You haven't requested any food items yet.
            </div>
          `;
        } else {
          outgoingContainer.innerHTML = outgoingRequests.map(r => `
            <div class="card mb-3 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 class="fw-bold text-dark mb-1">${r.foodName || r.food_name || 'Surplus Food'}</h5>
                    <span class="badge bg-light text-dark border me-1">${r.category || 'General'}</span>
                    <span class="badge ${r.action === 'Free' ? 'bg-success' : 'bg-primary'}">${r.action === 'Free' ? 'FREE' : '₹' + (r.price || 0)}</span>
                  </div>
                  <span class="badge ${r.status === 'Accepted' ? 'bg-info text-dark' : (r.status === 'Completed' ? 'bg-success' : (r.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'))}">
                    ${r.status}
                  </span>
                </div>
                <p class="small text-muted mb-0">
                  Listed by Owner: <strong>${r.ownerName || r.owner_name || 'Community Member'}</strong>
                </p>
                ${r.status === 'Accepted' ? `
                  <div class="alert alert-info py-2 px-3 mt-2 mb-0 small">
                    <i class="bi bi-check-circle me-1"></i> Owner accepted your request! Connect to arrange pickup.
                  </div>
                ` : ``}
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  }

  loadRequests();
  // Auto-sync requests every 5 seconds for real-time notifications across devices
  setInterval(loadRequests, 5000);
}

// Global action handlers
window.handleAcceptRequest = async function(id) {
  const success = await updateRequestState(id, 'accept');
  if (success) {
    alert('Request accepted! The requester can now arrange pickup with you.');
    initRequestsPage();
  }
};

window.handleRejectRequest = async function(id) {
  const success = await updateRequestState(id, 'reject');
  if (success) {
    initRequestsPage();
  }
};

window.handleCompleteRequest = async function(id) {
  const success = await updateRequestState(id, 'complete');
  if (success) {
    alert('Food sharing transaction completed!');
    initRequestsPage();
  }
};

// MY FOODS PAGE INITIALIZATION
async function initMyFoodsPage() {
  const container = document.getElementById('myFoodsList');
  const tabs = document.querySelectorAll('#myFoodTabs .nav-link');
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  let activeTab = 'Available';

  async function renderMyFoods() {
    if (!container) return;

    try {
      const res = await API.get(`/foods?action=my&userId=${user.id}&userName=${encodeURIComponent(user.name || '')}`);
      const myFoods = res.foods || [];

      const filtered = myFoods.filter(f => (f.status || 'Available') === activeTab);

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <div class="bg-white p-4 rounded-3 border shadow-sm">
              <i class="bi bi-box-seam fs-1 text-muted"></i>
              <h5 class="fw-bold mt-2">No ${activeTab} foods found</h5>
              <p class="text-muted mb-3">You currently have no listings in the "${activeTab}" tab.</p>
              <a href="share-food.html" class="btn btn-green">+ Share Food Now</a>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(f => {
        const expiry = getExpiryStatus(f.spoilingDate || f.spoiling_date);
        return `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="food-item-card h-100">
              <div class="food-card-header">
                <span class="food-category-pill"><i class="bi bi-tag me-1"></i>${f.category}</span>
                <span class="badge ${f.action === 'Free' ? 'bg-success' : 'bg-primary'}">${f.action === 'Free' ? 'FREE' : '₹' + (f.finalPrice || f.final_price || 0)}</span>
              </div>
              <div class="food-card-body">
                <h5 class="food-title">${f.name}</h5>
                <div class="food-meta-info">
                  <div><i class="bi bi-box me-1"></i> Quantity: <strong>${f.quantity}</strong></div>
                  <div><i class="bi bi-geo-alt me-1"></i> Location: <strong>${f.location || 'Local Pickup'}</strong></div>
                </div>

                <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                  <span class="badge ${expiry.cssClass}">${expiry.badgeText}</span>
                  <button onclick="handleDeleteMyFood(${f.id})" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash me-1"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = `<div class="col-12 text-center py-5 text-muted">Failed to load your foods.</div>`;
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-tab') || 'Available';
      renderMyFoods();
    });
  });

  renderMyFoods();
  setInterval(renderMyFoods, 5000);
}

window.handleDeleteMyFood = async function(id) {
  const success = await deleteFoodListing(id);
  if (success) {
    initMyFoodsPage();
  }
};
