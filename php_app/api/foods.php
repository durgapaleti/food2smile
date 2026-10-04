<?php
/**
 * Food2Smile - PHP Foods API (api/foods.php)
 * Handles food creation, listing, searching, filtering, and automatic expiry updates.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$pdo = getDBConnection();

// Auto purge expired items (if spoiling_date < today)
$todayStr = date('Y-m-d');
$pdo->exec("UPDATE foods SET status = 'Expired' WHERE status = 'Available' AND spoiling_date < '$todayStr'");

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php_input'), true) ?? $_POST;

// GET FOOD BY ID
if (isset($_GET['id']) && $action !== 'delete') {
    $foodId = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT f.*, u.email as owner_email, u.phone as owner_phone FROM foods f LEFT JOIN users u ON f.owner_id = u.id WHERE f.id = :id");
    $stmt->execute([':id' => $foodId]);
    $food = $stmt->fetch();

    if ($food) {
        $food['id'] = (int)$food['id'];
        $food['owner_id'] = (int)$food['owner_id'];
        $food['originalPrice'] = (float)$food['original_price'];
        $food['finalPrice'] = (float)$food['final_price'];
        $food['deliveryOption'] = $food['delivery_option'];
        $food['ownerName'] = $food['owner_name'];
        $food['spoilingDate'] = $food['spoiling_date'];
        
        echo json_encode(['success' => true, 'food' => $food]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Food listing not found']);
    }
    exit;
}

// GET MY FOODS
if ($action === 'my') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }
    $userId = (int)$_SESSION['user']['id'];
    $stmt = $pdo->prepare("SELECT * FROM foods WHERE owner_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$food) {
        $food['id'] = (int)$food['id'];
        $food['originalPrice'] = (float)$food['original_price'];
        $food['finalPrice'] = (float)$food['final_price'];
        $food['deliveryOption'] = $food['delivery_option'];
        $food['ownerName'] = $food['owner_name'];
        $food['spoilingDate'] = $food['spoiling_date'];
    }

    echo json_encode(['success' => true, 'count' => count($rows), 'foods' => $rows]);
    exit;
}

// DELETE FOOD
if ($action === 'delete' || ($method === 'DELETE' && isset($_GET['id']))) {
    if (!isset($_SESSION['user'])) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }
    $foodId = (int)$_GET['id'];
    $userId = (int)$_SESSION['user']['id'];

    $stmt = $pdo->prepare("DELETE FROM foods WHERE id = :id AND owner_id = :uid");
    $stmt->execute([':id' => $foodId, ':uid' => $userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Listing removed successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Not authorized or listing not found']);
    }
    exit;
}

// POST CREATE FOOD
if ($method === 'POST') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(['success' => false, 'message' => 'Please log in to share food']);
        exit;
    }

    $name = trim($input['name'] ?? '');
    $category = trim($input['category'] ?? '');
    $quantity = trim($input['quantity'] ?? '');
    $location = trim($input['location'] ?? 'Local Pickup');
    $originalPrice = (float)($input['originalPrice'] ?? 0);
    $foodAction = trim($input['action'] ?? 'Free');
    $discount = (int)($input['discount'] ?? 0);
    $finalPrice = (float)($input['finalPrice'] ?? 0);
    $deliveryOption = trim($input['deliveryOption'] ?? 'Self Pickup');
    $spoilingDate = trim($input['spoilingDate'] ?? date('Y-m-d'));
    $description = trim($input['description'] ?? '');

    if (empty($name) || empty($category) || empty($quantity) || empty($spoilingDate)) {
        echo json_encode(['success' => false, 'message' => 'Please provide all required food details']);
        exit;
    }

    $user = $_SESSION['user'];

    $stmt = $pdo->prepare("INSERT INTO foods 
        (owner_id, owner_name, name, category, quantity, location, original_price, action, discount, final_price, delivery_option, spoiling_date, description, status) 
        VALUES (:oid, :oname, :name, :cat, :qty, :loc, :oprice, :action, :disc, :fprice, :delopt, :spdate, :desc, 'Available')");
    
    $stmt->execute([
        ':oid' => $user['id'],
        ':oname' => $user['name'],
        ':name' => $name,
        ':cat' => $category,
        ':qty' => $quantity,
        ':loc' => $location,
        ':oprice' => $originalPrice,
        ':action' => $foodAction,
        ':disc' => $discount,
        ':fprice' => $finalPrice,
        ':delopt' => $deliveryOption,
        ':spdate' => $spoilingDate,
        ':desc' => $description
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Food listed successfully!',
        'food' => [
            'id' => (int)$newId,
            'name' => $name,
            'category' => $category,
            'quantity' => $quantity,
            'status' => 'Available'
        ]
    ]);
    exit;
}

// GET ALL AVAILABLE FOODS WITH FILTER / SORT / SEARCH
$categoryFilter = $_GET['category'] ?? 'All';
$actionFilter = $_GET['action'] ?? 'All';
$searchQuery = trim($_GET['search'] ?? '');
$sortVal = $_GET['sort'] ?? 'newest';

$sql = "SELECT * FROM foods WHERE status = 'Available'";
$params = [];

if ($categoryFilter !== 'All') {
    $sql .= " AND category = :category";
    $params[':category'] = $categoryFilter;
}

if ($actionFilter !== 'All') {
    $sql .= " AND action = :action";
    $params[':action'] = $actionFilter;
}

if (!empty($searchQuery)) {
    $sql .= " AND (LOWER(name) LIKE :q OR LOWER(category) LIKE :q OR LOWER(location) LIKE :q OR LOWER(description) LIKE :q)";
    $params[':q'] = '%' . strtolower($searchQuery) . '%';
}

if ($sortVal === 'price-low') {
    $sql .= " ORDER BY final_price ASC";
} else if ($sortVal === 'price-high') {
    $sql .= " ORDER BY final_price DESC";
} else if ($sortVal === 'spoiling-soon') {
    $sql .= " ORDER BY spoiling_date ASC";
} else {
    $sql .= " ORDER BY created_at DESC";
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

foreach ($rows as &$food) {
    $food['id'] = (int)$food['id'];
    $food['originalPrice'] = (float)$food['original_price'];
    $food['finalPrice'] = (float)$food['final_price'];
    $food['deliveryOption'] = $food['delivery_option'];
    $food['ownerName'] = $food['owner_name'];
    $food['spoilingDate'] = $food['spoiling_date'];
}

echo json_encode(['success' => true, 'count' => count($rows), 'foods' => $rows]);
?>
