<?php require_once __DIR__ . '/config/db.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Find Surplus Food - Food2Smile</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Navigation Bar -->
  <nav class="navbar navbar-expand-lg navbar-custom sticky-top">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center" href="index.php">
        <i class="bi bi-heart-pulse-fill me-2 text-warning"></i>Food2<span>Smile</span>
      </a>
      <button class="navbar-toggler text-white border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarMain">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
          <li class="nav-item"><a class="nav-link" href="index.php">Home</a></li>
          <li class="nav-item"><a class="nav-link active" href="find-food.php">Find Food</a></li>
          <li class="nav-item"><a class="nav-link" href="share-food.php">Share Food</a></li>
          <li class="nav-item"><a class="nav-link" href="going-away.php">Going Away</a></li>
          <li class="nav-item"><a class="nav-link" href="my-foods.php">My Foods</a></li>
          <li class="nav-item"><a class="nav-link" href="requests.php">Requests</a></li>
          <li class="nav-item"><a class="nav-link" href="dashboard.php">Dashboard</a></li>
        </ul>
        <div id="navbarAuthSection" class="d-flex align-items-center"></div>
      </div>
    </div>
  </nav>

  <main class="container my-4">
    <!-- Header & Search Bar -->
    <div class="row align-items-center mb-4">
      <div class="col-md-6 mb-3 mb-md-0">
        <h2 class="fw-bold text-dark mb-1">Find Food Marketplace</h2>
        <p class="text-muted mb-0">Discover available surplus food listed by nearby community members.</p>
      </div>

      <div class="col-md-6">
        <div class="input-group input-group-lg shadow-sm">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input type="text" id="searchInput" class="form-control border-start-0" placeholder="Search by food name, category, or location...">
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="card card-body border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
      <div class="row g-3 align-items-center">
        <!-- Category Filter Chips -->
        <div class="col-lg-8">
          <label class="form-label small text-muted fw-bold d-block mb-2">CATEGORY FILTER:</label>
          <div class="d-flex flex-wrap gap-2">
            <span class="chip-filter category-chip active" data-category="All">All</span>
            <span class="chip-filter category-chip" data-category="Vegetables">Vegetables</span>
            <span class="chip-filter category-chip" data-category="Fruits">Fruits</span>
            <span class="chip-filter category-chip" data-category="Dairy">Dairy</span>
            <span class="chip-filter category-chip" data-category="Bakery">Bakery</span>
            <span class="chip-filter category-chip" data-category="Cooked Food">Cooked Food</span>
            <span class="chip-filter category-chip" data-category="Groceries">Groceries</span>
          </div>
        </div>

        <!-- Offer Type & Sorting -->
        <div class="col-lg-4">
          <div class="row g-2">
            <div class="col-6">
              <label for="actionFilterSelect" class="form-label small text-muted fw-bold mb-1">OFFER TYPE:</label>
              <select id="actionFilterSelect" class="form-select form-select-sm">
                <option value="All" selected>All Offers</option>
                <option value="Sell">For Sale</option>
                <option value="Discount">Discounted</option>
                <option value="Free">Free Only</option>
                <option value="Donate">Donations</option>
              </select>
            </div>

            <div class="col-6">
              <label for="sortSelect" class="form-label small text-muted fw-bold mb-1">SORT BY:</label>
              <select id="sortSelect" class="form-select form-select-sm">
                <option value="newest" selected>Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="spoiling-soon">Spoiling Soonest</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Food Grid -->
    <div class="row" id="findFoodGrid">
      <!-- Dynamically populated by js/foods.js -->
    </div>
  </main>

  <footer>
    <div class="container text-center">
      <h5 class="fw-bold text-white mb-1"><i class="bi bi-heart-pulse-fill me-1 text-warning"></i> Food2Smile</h5>
      <p class="small text-white-50 mb-0">Turn Surplus into Smiles. ❤️</p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/api.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/foods.js"></script>
  <script src="js/requests.js"></script>
  <script src="js/dashboard.js"></script>
  <script src="js/script.js"></script>
</body>
</html>
