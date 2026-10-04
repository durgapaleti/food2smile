<?php
/**
 * Food2Smile - PHP Auth API (api/auth.php)
 * Handles registration, authentication, session validation using PDO Prepared Statements.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php_input'), true) ?? $_POST;

function cleanDigits($val) {
    if (!$val) return '';
    return preg_replace('/\D/', '', $val);
}

$pdo = getDBConnection();

// REGISTER
if ($action === 'register' || $_SERVER['REQUEST_METHOD'] === 'POST' && isset($input['name'])) {
    $name = trim($input['name'] ?? '');
    $emailInput = trim($input['email'] ?? '');
    $phoneInput = trim($input['phone'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($name) || (empty($emailInput) && empty($phoneInput)) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
        exit;
    }

    $cleanPhone = cleanDigits(!empty($phoneInput) ? $phoneInput : $emailInput);
    $userEmail = strpos($emailInput, '@') !== false ? strtolower($emailInput) : ($cleanPhone ? "{$cleanPhone}@food2smile.local" : '');

    // Check duplicate
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email OR (phone = :phone AND phone != '')");
    $stmt->execute([':email' => $userEmail, ':phone' => $cleanPhone]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'An account with this phone or email already exists.']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $insertStmt = $pdo->prepare("INSERT INTO users (name, email, phone, password) VALUES (:name, :email, :phone, :password)");
    $insertStmt->execute([
        ':name' => $name,
        ':email' => $userEmail,
        ':phone' => $cleanPhone,
        ':password' => $hashedPassword
    ]);

    $userId = $pdo->lastInsertId();

    $user = [
        'id' => (int)$userId,
        'name' => $name,
        'email' => $userEmail,
        'phone' => $cleanPhone,
        'profileImage' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    ];

    $_SESSION['user'] = $user;

    echo json_encode([
        'success' => true,
        'message' => 'Registration successful!',
        'user' => $user
    ]);
    exit;
}

// LOGIN
if ($action === 'login' || ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($input['name']))) {
    $rawInput = trim($input['email'] ?? ($input['phone'] ?? ''));
    $password = trim($input['password'] ?? '');

    if (empty($rawInput) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Please enter phone number/email and password.']);
        exit;
    }

    $isEmail = strpos($rawInput, '@') !== false;
    $cleanedDigits = cleanDigits($rawInput);

    if ($isEmail) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = :login");
        $stmt->execute([':login' => strtolower($rawInput)]);
    } else {
        $syntheticEmail = "{$cleanedDigits}@food2smile.local";
        $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = :digits OR phone = :raw OR email = :synth");
        $stmt->execute([':digits' => $cleanedDigits, ':raw' => $rawInput, ':synth' => $syntheticEmail]);
    }

    $userRecord = $stmt->fetch();

    if (!$userRecord || !password_verify($password, $userRecord['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid login credentials. Please try again.']);
        exit;
    }

    $user = [
        'id' => (int)$userRecord['id'],
        'name' => $userRecord['name'],
        'email' => $userRecord['email'],
        'phone' => $userRecord['phone'],
        'profileImage' => $userRecord['profile_image']
    ];

    $_SESSION['user'] = $user;

    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'user' => $user
    ]);
    exit;
}

// GET ME / PROFILE
if ($action === 'me') {
    if (isset($_SESSION['user'])) {
        echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    }
    exit;
}

// LOGOUT
if ($action === 'logout') {
    unset($_SESSION['user']);
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
