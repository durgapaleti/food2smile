<?php require_once __DIR__ . '/config/db.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register Account - Food2Smile</title>
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

  <main class="container my-5">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="form-card">
          <div class="auth-card-top-bar"></div>

          <!-- Header -->
          <div class="text-center mb-4 pt-2">
            <div class="d-inline-flex align-items-center justify-content-center bg-light-green text-success rounded-circle p-3 mb-2 shadow-sm" style="width:64px; height:64px;">
              <i class="bi bi-person-plus-fill fs-2"></i>
            </div>
            <h3 class="fw-bold text-dark mb-1">Create Account</h3>
            <p class="text-muted small mb-0">Join Food2Smile to share and receive surplus food. ❤️</p>
          </div>

          <!-- Alert Feedback -->
          <div id="authAlert" class="alert alert-danger d-none py-2 px-3 small rounded-3 mb-3"></div>

          <!-- Register Form -->
          <form id="registerForm">
            <!-- Full Name -->
            <div class="mb-3">
              <label for="regName" class="form-label">Full Name <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text auth-input-icon"><i class="bi bi-person"></i></span>
                <input type="text" id="regName" class="form-control" placeholder="FunPanda" required>
              </div>
            </div>

            <!-- Mobile Phone Number -->
            <div class="mb-3">
              <label for="regPhone" class="form-label">Mobile Phone Number <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text auth-input-icon fw-bold">+91</span>
                <input type="tel" id="regPhone" class="form-control" placeholder="9876543210" maxlength="10" required>
              </div>
            </div>

            <!-- Password -->
            <div class="mb-3">
              <label for="regPassword" class="form-label">Password <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text auth-input-icon"><i class="bi bi-lock"></i></span>
                <input type="password" id="regPassword" class="form-control" placeholder="••••••••" minlength="6" required>
                <button type="button" class="input-group-text password-toggle-btn" onclick="togglePasswordVisibility('regPassword', this)">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="mb-4">
              <label for="regConfirmPassword" class="form-label">Confirm Password <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text auth-input-icon"><i class="bi bi-shield-lock"></i></span>
                <input type="password" id="regConfirmPassword" class="form-control" placeholder="••••••••" minlength="6" required>
                <button type="button" class="input-group-text password-toggle-btn" onclick="togglePasswordVisibility('regConfirmPassword', this)">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="regSubmitBtn" class="btn btn-green w-100 py-2.5 fs-5 rounded-3 mb-3 d-flex align-items-center justify-content-center gap-2">
              <span>Register Account</span> <i class="bi bi-check-circle"></i>
            </button>

            <!-- Login Link -->
            <div class="text-center small text-muted">
              Already registered? <a href="login.php" class="text-success fw-bold text-decoration-none">Log in here</a>
            </div>
          </form>
        </div>
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
