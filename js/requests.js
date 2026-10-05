/**
 * Food2Smile - Requests Module (js/requests.js)
 * REST API Integration for creating, accepting, rejecting, and completing food requests.
 */

async function sendFoodRequest(foodId) {
  if (!isLoggedIn()) {
    alert('Please log in first to send a food request.');
    window.location.href = 'login.html';
    return false;
  }

  const user = getCurrentUser();

  try {
    const res = await API.post('/requests', {
      foodId,
      requesterId: user ? user.id : 'u-102',
      requesterName: user ? user.name : 'Interested Neighbor',
      requesterPhone: user ? (user.phone || user.email) : '9876543210'
    });
    if (res.success) {
      alert('Request submitted successfully! The owner will review your request.');
      return true;
    }
    alert(res.message || 'Request failed');
    return false;
  } catch (err) {
    alert(err.message || 'Request failed');
    return false;
  }
}

async function updateRequestState(requestId, actionStatus) {
  try {
    const res = await API.post('/requests/action', {
      id: requestId,
      action: actionStatus.toLowerCase()
    });
    if (res.success) {
      return true;
    }
    alert(res.message || 'Failed to update request');
    return false;
  } catch (err) {
    alert(err.message || 'Failed to update request');
    return false;
  }
}
