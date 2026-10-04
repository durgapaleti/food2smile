<?php
/**
 * Food2Smile - PHP Dashboard API (api/dashboard.php)
 * Calculates personal and platform-wide community statistics from MySQL database.
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

// 1. Personal Stats
$myFoodsStmt = $pdo->prepare("SELECT * FROM foods WHERE owner_id = :uid");
$myFoodsStmt->execute([':uid' => $userId]);
$myFoods = $myFoodsStmt->fetchAll();

$personalListed = count($myFoods);
$personalAvailable = 0;
$personalSold = 0;
$personalGiven = 0;
$personalDonated = 0;
$personalSaved = 0;

foreach ($myFoods as $f) {
    $st = $f['status'];
    $act = $f['action'];
    if ($st === 'Available') $personalAvailable++;
    if ($st === 'Sold' || (($act === 'Sell' || $act === 'Discount') && $st === 'Completed')) $personalSold++;
    if ($st === 'Given' || ($act === 'Free' && $st === 'Completed')) $personalGiven++;
    if ($st === 'Donated' || ($act === 'Donate' && $st === 'Completed')) $personalDonated++;
}
$personalSaved = $personalSold + $personalGiven + $personalDonated;

$pReqStmt = $pdo->prepare("SELECT COUNT(*) FROM requests WHERE owner_id = :uid AND status = 'Pending'");
$pReqStmt->execute([':uid' => $userId]);
$personalPendingRequests = (int)$pReqStmt->fetchColumn();

// 2. Community Stats
$allFoodsStmt = $pdo->query("SELECT * FROM foods");
$allFoods = $allFoodsStmt->fetchAll();

$communityListed = count($allFoods);
$communityAvailable = 0;
$communitySold = 0;
$communityGiven = 0;
$communityDonated = 0;
$communitySaved = 0;

foreach ($allFoods as $f) {
    $st = $f['status'];
    $act = $f['action'];
    if ($st === 'Available') $communityAvailable++;
    if ($st === 'Sold' || (($act === 'Sell' || $act === 'Discount') && $st === 'Completed')) $communitySold++;
    if ($st === 'Given' || ($act === 'Free' && $st === 'Completed')) $communityGiven++;
    if ($st === 'Donated' || ($act === 'Donate' && $st === 'Completed')) $communityDonated++;
}
$communitySaved = $communitySold + $communityGiven + $communityDonated;

// Recent Foods & Requests
$recentFoodsStmt = $pdo->prepare("SELECT * FROM foods WHERE owner_id = :uid ORDER BY created_at DESC LIMIT 5");
$recentFoodsStmt->execute([':uid' => $userId]);
$recentFoods = $recentFoodsStmt->fetchAll();

$recentReqsStmt = $pdo->prepare("SELECT * FROM requests WHERE owner_id = :uid OR requester_id = :uid ORDER BY created_at DESC LIMIT 5");
$recentReqsStmt->execute([':uid' => $userId]);
$recentRequests = $recentReqsStmt->fetchAll();

$commFoodsStmt = $pdo->query("SELECT * FROM foods ORDER BY created_at DESC LIMIT 5");
$communityFoods = $commFoodsStmt->fetchAll();

$commReqsStmt = $pdo->query("SELECT * FROM requests ORDER BY created_at DESC LIMIT 5");
$communityRequests = $commReqsStmt->fetchAll();

function formatFoodItem(&$f) {
    $f['id'] = (int)$f['id'];
    $f['ownerName'] = $f['owner_name'];
    $f['finalPrice'] = (float)$f['final_price'];
}

function formatReqItem(&$r) {
    $r['id'] = (int)$r['id'];
    $r['foodName'] = $r['food_name'];
    $r['requesterName'] = $r['requester_name'];
    $r['ownerName'] = $r['owner_name'];
}

foreach ($recentFoods as &$f) formatFoodItem($f);
foreach ($communityFoods as &$f) formatFoodItem($f);
foreach ($recentRequests as &$r) formatReqItem($r);
foreach ($communityRequests as &$r) formatReqItem($r);

echo json_encode([
    'success' => true,
    'stats' => [
        'listedCount' => $personalListed,
        'availableCount' => $personalAvailable,
        'soldCount' => $personalSold,
        'givenCount' => $personalGiven,
        'donatedCount' => $personalDonated,
        'savedCount' => $personalSaved,
        'pendingRequestsCount' => $personalPendingRequests
    ],
    'communityStats' => [
        'listedCount' => $communityListed,
        'availableCount' => $communityAvailable,
        'soldCount' => $communitySold,
        'givenCount' => $communityGiven,
        'donatedCount' => $communityDonated,
        'savedCount' => $communitySaved
    ],
    'recentFoods' => $recentFoods,
    'recentRequests' => $recentRequests,
    'communityFoods' => $communityFoods,
    'communityRequests' => $communityRequests
]);
?>
