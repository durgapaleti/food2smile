<?php
/**
 * Food2Smile - PHP & MySQL Database Connector (config/db.php)
 * Modules 4 & 5: PHP PDO with Prepared Statements & Database Transactions
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'food2smile');

function getDBConnection() {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    try {
        // 1. Try MySQL Connection via PDO
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        return $pdo;
    } catch (PDOException $e) {
        // 2. Fallback to SQLite Database for Instant Zero-Config Run
        try {
            $dataDir = __DIR__ . '/../data';
            if (!file_exists($dataDir)) {
                mkdir($dataDir, 0777, true);
            }
            $sqliteFile = $dataDir . '/food2smile.sqlite';
            $pdo = new PDO("sqlite:" . $sqliteFile, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // Initialize SQLite Schema & Seed Data if empty
            initSQLiteSchema($pdo);
            return $pdo;
        } catch (Exception $sqliteErr) {
            die("Database Connection Error: " . $e->getMessage());
        }
    }
}

function initSQLiteSchema($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            profile_image TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS foods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            owner_name TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity TEXT NOT NULL,
            location TEXT DEFAULT 'Local Pickup',
            original_price REAL DEFAULT 0,
            action TEXT NOT NULL,
            discount INTEGER DEFAULT 0,
            final_price REAL DEFAULT 0,
            delivery_option TEXT DEFAULT 'Self Pickup',
            spoiling_date DATE NOT NULL,
            image TEXT DEFAULT 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
            description TEXT,
            status TEXT DEFAULT 'Available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food_id INTEGER NOT NULL,
            food_name TEXT NOT NULL,
            category TEXT NOT NULL,
            action TEXT NOT NULL,
            price REAL DEFAULT 0,
            requester_id INTEGER NOT NULL,
            requester_name TEXT NOT NULL,
            requester_email TEXT,
            requester_phone TEXT,
            owner_id INTEGER NOT NULL,
            owner_name TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($userCount == 0) {
        $hashedPass = password_hash('password123', PASSWORD_BCRYPT);
        $pdo->exec("INSERT INTO users (id, name, email, phone, password) VALUES 
            (1, 'Ananya Sharma', 'funpanda06@gmail.com', '9876543210', '$hashedPass'),
            (2, 'Priya Verma', 'priya@gmail.com', '9876543211', '$hashedPass');
        ");

        $pdo->exec("INSERT INTO foods (id, owner_id, owner_name, name, category, quantity, location, original_price, action, discount, final_price, delivery_option, spoiling_date, image, description, status) VALUES 
            (1, 1, 'Ananya Sharma', 'Fresh Organic Tomatoes', 'Vegetables', '3 kg', 'Koramangala, Bangalore', 120.0, 'Free', 100, 0.0, 'Self Pickup', date('now', '+2 days'), 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', 'Harvested yesterday from home garden.', 'Available'),
            (2, 2, 'Priya Verma', 'Whole Wheat Fresh Bread', 'Bakery', '2 Loaves', 'Indiranagar, Bangalore', 90.0, 'Discount', 50, 45.0, 'Self Pickup', date('now', '+1 days'), 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', 'Freshly baked artisanal whole wheat bread.', 'Available'),
            (3, 1, 'Ananya Sharma', 'Alphonso Mangoes', 'Fruits', '5 kg', 'Whitefield, Bangalore', 600.0, 'Sell', 30, 420.0, 'Home Delivery', date('now', '+4 days'), 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80', 'Sweet juicy mangoes straight from Ratnagiri orchard.', 'Available');
        ");
    }
}
?>
