-- ===================================================
-- Food2Smile - MySQL Database Schema
-- Modules 4 & 5: PHP & MySQL Database Integration
-- Compatible with phpMyAdmin, XAMPP, WAMP, MySQL 5.7+ / 8.0+
-- ===================================================

CREATE DATABASE IF NOT EXISTS `food2smile` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `food2smile`;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_image` VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `foods`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `foods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `owner_id` INT NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Cooked Food', 'Groceries', 'Other') NOT NULL,
  `quantity` VARCHAR(100) NOT NULL,
  `location` VARCHAR(150) DEFAULT 'Local Pickup',
  `original_price` DECIMAL(10,2) DEFAULT 0.00,
  `action` ENUM('Sell', 'Discount', 'Free', 'Donate') NOT NULL,
  `discount` INT DEFAULT 0,
  `final_price` DECIMAL(10,2) DEFAULT 0.00,
  `delivery_option` VARCHAR(100) DEFAULT 'Self Pickup',
  `spoiling_date` DATE NOT NULL,
  `image` VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
  `description` TEXT,
  `status` ENUM('Available', 'Requested', 'Sold', 'Given', 'Donated', 'Completed', 'Expired') DEFAULT 'Available',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `requests`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `food_id` INT NOT NULL,
  `food_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `requester_id` INT NOT NULL,
  `requester_name` VARCHAR(100) NOT NULL,
  `requester_email` VARCHAR(150),
  `requester_phone` VARCHAR(20),
  `owner_id` INT NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `message` TEXT,
  `status` ENUM('Pending', 'Accepted', 'Rejected', 'Completed') DEFAULT 'Pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Initial Seed Data for Demo Accounts
-- Password for demo accounts is 'password123'
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`) VALUES
(1, 'Ananya Sharma', 'funpanda06@gmail.com', '9876543210', '$2y$10$E4QtNyPMC/Yk/G93C71UMO/Kp53SFE4hpXGJuap6txmIFQ7SP7pD6'),
(2, 'Priya Verma', 'priya@gmail.com', '9876543211', '$2y$10$E4QtNyPMC/Yk/G93C71UMO/Kp53SFE4hpXGJuap6txmIFQ7SP7pD6');

INSERT INTO `foods` (`id`, `owner_id`, `owner_name`, `name`, `category`, `quantity`, `location`, `original_price`, `action`, `discount`, `final_price`, `delivery_option`, `spoiling_date`, `image`, `description`, `status`) VALUES
(1, 1, 'Ananya Sharma', 'Fresh Organic Tomatoes', 'Vegetables', '3 kg', 'Koramangala, Bangalore', 120.00, 'Free', 100, 0.00, 'Self Pickup', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', 'Harvested yesterday from home garden.', 'Available'),
(2, 2, 'Priya Verma', 'Whole Wheat Fresh Bread', 'Bakery', '2 Loaves', 'Indiranagar, Bangalore', 90.00, 'Discount', 50, 45.00, 'Self Pickup', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', 'Freshly baked artisanal whole wheat bread.', 'Available'),
(3, 1, 'Ananya Sharma', 'Alphonso Mangoes', 'Fruits', '5 kg', 'Whitefield, Bangalore', 600.00, 'Sell', 30, 420.00, 'Home Delivery', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80', 'Sweet juicy mangoes straight from Ratnagiri orchard.', 'Available');
