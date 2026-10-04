/**
 * Food2Smile - Dashboard Renderer (dashboard.js)
 * Fetches real-time database metrics from GET /api/dashboard/stats and updates UI counters.
 */

let dashboardData = null;
let currentDashboardView = 'community';

function toggleDashboardView(mode) {
  currentDashboardView = mode;
  const btnComm = document.getElementById('btnViewCommunity');
  const btnPers = document.getElementById('btnViewPersonal');

  if (btnComm && btnPers) {
    if (mode === 'community') {
      btnComm.classList.add('active');
      btnPers.classList.remove('active');
    } else {
      btnPers.classList.add('active');
      btnComm.classList.remove('active');
    }
  }

  updateDashboardUI();
}

function updateDashboardUI() {
  if (!dashboardData) return;

  const { stats, communityStats, recentFoods, recentRequests, communityFoods, communityRequests } = dashboardData;
  const user = getCurrentUser();
  const userName = user ? user.name : 'User';

  const isPersonal = currentDashboardView === 'personal';
  const targetStats = isPersonal ? (stats || {}) : (communityStats || stats || {});

  const elListed = document.getElementById('statListed');
  const elAvailable = document.getElementById('statAvailable');
  const elSold = document.getElementById('statSold');
  const elGiven = document.getElementById('statGiven');
  const elDonated = document.getElementById('statDonated');
  const elSaved = document.getElementById('statSaved');

  if (elListed) elListed.textContent = targetStats.listedCount || 0;
  if (elAvailable) elAvailable.textContent = targetStats.availableCount || 0;
  if (elSold) elSold.textContent = targetStats.soldCount || 0;
  if (elGiven) elGiven.textContent = targetStats.givenCount || 0;
  if (elDonated) elDonated.textContent = targetStats.donatedCount || 0;
  if (elSaved) elSaved.textContent = targetStats.savedCount || 0;

  // Banner text
  const noticeText = document.getElementById('welcomeNoticeText');
  if (noticeText) {
    if (isPersonal) {
      noticeText.innerHTML = `Showing <strong>${userName}'s Personal Impact Stats</strong>. You have listed <strong>${stats.listedCount || 0}</strong> surplus food items!`;
    } else {
      noticeText.innerHTML = `Showing <strong>Overall Food2Smile Platform Impact</strong>. Join the community effort by sharing extra food!`;
    }
  }

  // Titles
  const foodTitle = document.getElementById('foodListHeaderTitle');
  if (foodTitle) {
    foodTitle.textContent = isPersonal ? "My Recent Food Listings" : "Recent Community Food Listings";
  }

  const reqTitle = document.getElementById('requestListHeaderTitle');
  if (reqTitle) {
    reqTitle.textContent = isPersonal ? "My Requests Activity" : "Recent Community Activity";
  }

  // Render Foods List
  const recentFoodsContainer = document.getElementById('recentFoodsList');
  if (recentFoodsContainer) {
    const listToRender = isPersonal ? (recentFoods || []) : (communityFoods || recentFoods || []);

    if (listToRender.length === 0) {
      recentFoodsContainer.innerHTML = `<div class="p-3 text-muted text-center">No foods listed yet. <a href="share-food.html" class="text-success fw-bold">Share Food now</a>.</div>`;
    } else {
      recentFoodsContainer.innerHTML = listToRender.map(f => `
        <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div>
            <span class="fw-bold text-dark">${f.name}</span>
            <span class="badge bg-light text-dark border ms-2">${f.category}</span>
            <div class="small text-muted"><i class="bi bi-person me-1"></i> ${f.ownerName || 'Community Member'}</div>
          </div>
          <div class="text-end">
            <span class="badge ${f.status === 'Available' ? 'bg-success' : 'bg-secondary'} mb-1 d-block">${f.status}</span>
            <span class="small fw-bold ${f.action === 'Free' ? 'text-success' : 'text-primary'}">${f.action === 'Free' ? 'FREE' : '₹' + f.finalPrice}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Requests List
  const recentRequestsContainer = document.getElementById('recentRequestsList');
  if (recentRequestsContainer) {
    const listToRender = isPersonal ? (recentRequests || []) : (communityRequests || recentRequests || []);

    if (listToRender.length === 0) {
      recentRequestsContainer.innerHTML = `<div class="p-3 text-muted text-center">No active requests recorded yet.</div>`;
    } else {
      recentRequestsContainer.innerHTML = listToRender.map(r => `
        <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div>
            <div class="fw-bold text-dark">${r.foodName}</div>
            <div class="small text-muted">Requester: <strong>${r.requesterName || 'User'}</strong> • Owner: <strong>${r.ownerName || 'Owner'}</strong></div>
          </div>
          <div>
            <span class="badge ${r.status === 'Accepted' ? 'bg-info text-dark' : (r.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark')}">${r.status}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

async function renderDashboardPage() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await API.get('/dashboard/stats');
    if (!res.success) return;

    dashboardData = res;

    // If personal listed count is 0, default to showing community view so metrics are non-zero!
    if (dashboardData.stats && dashboardData.stats.listedCount > 0) {
      currentDashboardView = 'personal';
    } else {
      currentDashboardView = 'community';
    }

    toggleDashboardView(currentDashboardView);
  } catch (err) {
    console.error('Failed to render dashboard stats:', err.message);
  }
}
