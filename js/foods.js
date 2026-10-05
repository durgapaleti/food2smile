/**
 * Food2Smile - Food Listing Module (foods.js)
 * REST API Integration for fetching, creating, filtering, and deleting foods.
 */

function getExpiryStatus(spoilingDateStr) {
  if (!spoilingDateStr) return { label: 'Unknown', cssClass: 'badge-expiry-safe', daysLeft: 99 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(spoilingDateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      label: 'Expired',
      badgeText: 'Expired',
      cssClass: 'badge-expiry-critical',
      daysLeft
    };
  } else if (daysLeft === 0) {
    return {
      label: 'Spoils Today',
      badgeText: '⚠️ Spoils Today',
      cssClass: 'badge-expiry-critical',
      daysLeft
    };
  } else if (daysLeft === 1) {
    return {
      label: 'Spoils Tomorrow',
      badgeText: '⚠️ Spoils Tomorrow',
      cssClass: 'badge-expiry-urgent',
      daysLeft
    };
  } else {
    return {
      label: `${daysLeft} days left`,
      badgeText: `Good for ${daysLeft} days`,
      cssClass: 'badge-expiry-safe',
      daysLeft
    };
  }
}

function calculateDiscountPrice(origPrice, pct) {
  const orig = parseFloat(origPrice) || 0;
  const discountVal = parseInt(pct) || 0;
  return Math.round(orig - (orig * (discountVal / 100)));
}

async function createFoodListing(foodData) {
  if (!isLoggedIn()) {
    const guestUser = { id: 'u-' + Date.now(), name: 'durga', phone: '9912351770' };
    setCurrentUser(guestUser);
    setToken('demo-token-' + Date.now());
    renderNavbarUser();
  }

  const user = getCurrentUser();
  const payload = {
    ...foodData,
    ownerId: user ? user.id : 'u-101',
    owner_id: user ? user.id : 'u-101',
    ownerName: user ? user.name : 'durga',
    owner_name: user ? user.name : 'durga'
  };

  try {
    const res = await API.post('/foods', payload);
    if (res.success) {
      return true;
    }
    alert(res.message || 'Failed to list food');
    return false;
  } catch (err) {
    alert(err.message || 'Failed to list food');
    return false;
  }
}

async function deleteFoodListing(foodId) {
  if (!confirm('Are you sure you want to remove this food listing?')) {
    return false;
  }
  try {
    const res = await API.delete(`/foods/${foodId}`);
    if (res.success) {
      return true;
    }
    alert(res.message || 'Failed to delete listing');
    return false;
  } catch (err) {
    alert(err.message || 'Failed to delete listing');
    return false;
  }
}

function renderFoodCardHTML(food) {
  const foodId = food._id || food.id;
  const expiry = getExpiryStatus(food.spoilingDate);

  let tagHTML = '';
  let priceHTML = '';

  if (food.action === 'Free') {
    tagHTML = `<span class="tag-free">FREE</span>`;
    priceHTML = `<div class="price-display"><span class="price-now text-success">₹0</span><span class="small text-muted">(${food.deliveryOption})</span></div>`;
  } else if (food.action === 'Donate') {
    tagHTML = `<span class="tag-donate">DONATION</span>`;
    priceHTML = `<div class="price-display"><span class="price-now text-danger">❤️ Free Donation</span></div>`;
  } else if (food.action === 'Discount') {
    tagHTML = `<span class="tag-discount">${food.discount}% OFF</span>`;
    priceHTML = `
      <div class="price-display">
        <span class="price-was">₹${food.originalPrice}</span>
        <span class="price-now">₹${food.finalPrice}</span>
      </div>
    `;
  } else {
    tagHTML = `<span class="badge bg-light text-dark border">FOR SALE</span>`;
    priceHTML = `<div class="price-display"><span class="price-now">₹${food.finalPrice}</span></div>`;
  }

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="food-item-card">
        <div class="food-card-header">
          <span class="food-category-pill"><i class="bi bi-tag me-1"></i>${food.category}</span>
          ${tagHTML}
        </div>
        <div class="food-card-body">
          <h5 class="food-title">${food.name}</h5>
          
          <div class="food-meta-info">
            <div><i class="bi bi-box me-1"></i> Quantity: <strong>${food.quantity}</strong></div>
            <div><i class="bi bi-geo-alt me-1"></i> Location: <strong>${food.location || 'Local Pickup'}</strong></div>
          </div>

          ${priceHTML}

          <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
            <span class="badge ${expiry.cssClass}">${expiry.badgeText}</span>
            <a href="food-details.html?id=${foodId}" class="btn btn-sm btn-outline-green">Details →</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
