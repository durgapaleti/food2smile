<?php
/**
 * Food2Smile - PHP Requests API (api/requests.php)
 * Handles multi-user request submission, owner approvals, and order completion transactions.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$pdo = getDBConnection();

if (!isset($_SESSION['user'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user = $_SESSION['user'];
$userId = (int)$user['id'];
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php_input'), true) ?? $_POST;

// ACCEPT REQUEST
if ($action === 'accept') {
    $reqId = (int)($_GET['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM requests WHERE id = :id AND owner_id = :oid");
    $stmt->execute([':id' => $reqId, ':oid' => $userId]);
    $reqRecord = $stmt->fetch();

    if (!$reqRecord) {
        echo json_encode(['success' => false, 'message' => 'Request not found or unauthorized']);
        exit;
    }

    $pdo->prepare("UPDATE requests SET status = 'Accepted' WHERE id = :id")->execute([':id' => $reqId]);
    $pdo->prepare("UPDATE foods SET status = 'Requested' WHERE id = :fid")->execute([':fid' => $reqRecord['food_id']]);

    echo json_encode(['success' => true, 'message' => 'Request accepted!']);
    exit;
}

// REJECT REQUEST
if ($action === 'reject') {
    $reqId = (int)($_GET['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM requests WHERE id = :id AND owner_id = :oid");
    $stmt->execute([':id' => $reqId, ':oid' => $userId]);
    $reqRecord = $stmt->fetch();

    if (!$reqRecord) {
        echo json_encode(['success' => false, 'message' => 'Request not found or unauthorized']);
        exit;
    }

    $pdo->prepare("UPDATE requests SET status = 'Rejected' WHERE id = :id")->execute([':id' => $reqId]);

    // Check if food still has active pending/accepted requests
    $chkStmt = $pdo->prepare("SELECT id FROM requests WHERE food_id = :fid AND id != :id AND status IN ('Pending', 'Accepted')");
    $chkStmt->execute([':fid' => $reqRecord['food_id'], ':id' => $reqId]);
    if (!$chkStmt->fetch()) {
        $pdo->prepare("UPDATE foods SET status = 'Available' WHERE id = :fid")->execute([':fid' => $reqRecord['food_id']]);
    }

    echo json_encode(['success' => true, 'message' => 'Request rejected']);
    exit;
}

// COMPLETE TRANSACTION
if ($action === 'complete') {
    $reqId = (int)($_GET['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM requests WHERE id = :id AND (owner_id = :uid OR requester_id = :uid)");
    $stmt->execute([':id' => $reqId, ':uid' => $userId]);
    $reqRecord = $stmt->fetch();

    if (!$reqRecord) {
        echo json_encode(['success' => false, 'message' => 'Request not found or unauthorized']);
        exit;
    }

    $pdo->prepare("UPDATE requests SET status = 'Completed' WHERE id = :id")->execute([':id' => $reqId]);

    $foodId = $reqRecord['food_id'];
    $foodStmt = $pdo->prepare("SELECT action FROM foods WHERE id = :fid");
    $foodStmt->execute([':fid' => $foodId]);
    $foodRecord = $foodStmt->fetch();

    if ($foodRecord) {
        $act = $foodRecord['action'];
        $newStatus = 'Completed';
        if ($act === 'Sell' || $act === 'Discount') $newStatus = 'Sold';
        else if ($act === 'Free') $newStatus = 'Given';
        else if ($act === 'Donate') $newStatus = 'Donated';

        $pdo->prepare("UPDATE foods SET status = :st WHERE id = :fid")->execute([':st' => $newStatus, ':fid' => $foodId]);
    }

    echo json_encode(['success' => true, 'message' => 'Transaction marked as completed!']);
    exit;
}

// SENT REQUESTS BY LOGGED-IN USER
if ($action === 'my') {
    $stmt = $pdo->prepare("SELECT r.*, f.name as food_name, f.category, f.delivery_option FROM requests r LEFT JOIN foods f ON r.food_id = f.id WHERE r.requester_id = :uid ORDER BY r.created_at DESC");
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id'] = (int)$r['id'];
        $r['foodId'] = (int)$r['food_id'];
        $r['foodName'] = $r['food_name'];
        $r['ownerName'] = $r['owner_name'];
    }

    echo json_encode(['success' => true, 'count' => count($rows), 'requests' => $rows]);
    exit;
}

// RECEIVED INCOMING REQUESTS
if ($action === 'received') {
    $stmt = $pdo->prepare("SELECT r.*, f.name as food_name, f.category FROM requests r LEFT JOIN foods f ON r.food_id = f.id WHERE r.owner_id = :uid ORDER BY r.created_at DESC");
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id'] = (int)$r['id'];
        $r['foodId'] = (int)$r['food_id'];
        $r['foodName'] = $r['food_name'];
        $r['requesterName'] = $r['requester_name'];
    }

    echo json_encode(['success' => true, 'count' => count($rows), 'requests' => $rows]);
    exit;
}

// POST CREATE A REQUEST
if ($method === 'POST') {
    $foodId = (int)($input['foodId'] ?? 0);
    $message = trim($input['message'] ?? '');

    if ($foodId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Please provide valid food ID']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM foods WHERE id = :fid");
    $stmt->execute([':fid' => $foodId]);
    $food = $stmt->fetch();

    if (!$food) {
        echo json_encode(['success' => false, 'message' => 'Food item not found']);
        exit;
    }

    if ((int)$food['owner_id'] === $userId) {
        echo json_encode(['success' => false, 'message' => 'You cannot request your own listed food item!']);
        exit;
    }

    // Check duplicate request
    $chkStmt = $pdo->prepare("SELECT id FROM requests WHERE food_id = :fid AND requester_id = :uid AND status != 'Rejected'");
    $chkStmt->execute([':fid' => $foodId, ':uid' => $userId]);
    if ($chkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already submitted a request for this food.']);
        exit;
    }

    $insStmt = $pdo->prepare("INSERT INTO requests 
        (food_id, food_name, category, action, price, requester_id, requester_name, requester_email, requester_phone, owner_id, owner_name, message, status) 
        VALUES (:fid, :fname, :cat, :act, :price, :rid, :rname, :remail, :rphone, :oid, :oname, :msg, 'Pending')");

    $insStmt->execute([
        ':fid' => $food['id'],
        ':fname' => $food['name'],
        ':cat' => $food['category'],
        ':act' => $food['action'],
        ':price' => $food['final_price'],
        ':rid' => $userId,
        ':rname' => $user['name'],
        ':remail' => $user['email'],
        ':rphone' => $user['phone'],
        ':oid' => $food['owner_id'],
        ':oname' => $food['owner_name'],
        ':msg' => $message
    ]);

    // Update food status to Requested
    $pdo->prepare("UPDATE foods SET status = 'Requested' WHERE id = :fid")->execute([':fid' => $foodId]);

    echo json_encode(['success' => true, 'message' => 'Request submitted successfully!']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
