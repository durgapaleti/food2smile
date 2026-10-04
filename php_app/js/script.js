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

  async function filterAndRender() {
    if (!foodGrid) return;

    foodGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading food marketplace...</span>
        </div>
      </div>
    `;

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
      foodGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted">Failed to load marketplace foods.</div>`;
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
    const res = await API.get(`/foods/${foodId}`);
    const food = res.food;

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
    `;/div>
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
