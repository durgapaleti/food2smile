<?php require_once __DIR__ . '/config/db.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Food Details - Food2Smile</title>
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
          <li class="nav-item"><a class="nav-link" href="find-food.php">Find Food</a></li>
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

  <main class="container my-5" id="foodDetailsContainer">
    <div class="text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading food details...</span>
      </div>
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
