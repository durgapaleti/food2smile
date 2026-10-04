# 🎓 Food2Smile - PHP & MySQL Full-Stack Web Application

**Tagline**: *"Turn Surplus into Smiles. ❤️"*  
**Course Alignment**: Web Technologies Syllabus (Modules 1-5: HTML5, CSS3, JavaScript/AJAX, Bootstrap 5, PHP, and MySQL Database)

---

## 📌 Project Overview
Food2Smile is a surplus food sharing web application designed strictly according to the college **Web Technologies Course Content**:
* **Module 1**: HTML5 Document Structure, Semantic Tags, Web Forms & Inputs.
* **Module 2**: CSS3 Styling, Flexbox/Grid, JavaScript Functions, Events, and **AJAX/Fetch Integration**.
* **Module 3**: Bootstrap 5 Responsive Layouts, Cards, Badges, Navigation Bar, and Alerts.
* **Module 4**: PHP OOP, Array Manipulation, Control Structures, and Functions.
* **Module 5**: PHP Form Data Handling, **Sessions/Cookies**, **MySQL Database Integration**, and **PDO Prepared Statements**.

---

## 🗄️ Database Setup (phpMyAdmin / MySQL)

1. Open **phpMyAdmin** in your browser (`http://localhost/phpmyadmin`).
2. Click **New** and create a database named: `food2smile`.
3. Click the **Import** tab.
4. Choose the `schema.sql` file located inside the `php_app/` folder and click **Import**.

---

## 🚀 How to Run the Application

### Option A: Using XAMPP / WAMP Server (Recommended for College Submissions)
1. Copy the entire `php_app` folder to your server directory:
   * **XAMPP**: `C:\xampp\htdocs\food2smile`
   * **WAMP**: `C:\wamp64\www\food2smile`
2. Start **Apache** and **MySQL** from XAMPP / WAMP Control Panel.
3. Open your browser and visit:  
   👉 **`http://localhost/food2smile/index.php`**

### Option B: Built-in PHP Web Server (Zero-Config Test)
1. Open Command Prompt or Terminal inside the `php_app/` folder.
2. Run the following command:
   ```bash
   php -S localhost:8000
   ```
3. Open your browser and visit:  
   👉 **`http://localhost:8000`**

---

## 🔑 Demo Account Credentials

| Login Identifier | Password | Role |
| :--- | :--- | :--- |
| `9876543210` / `funpanda06@gmail.com` | `password123` | Main User (Ananya Sharma) |
| `9876543211` / `priya@gmail.com` | `password123` | Secondary User (Priya Verma) |

---

## 📁 File Structure & Component Roles

```
php_app/
├── config/
│   └── db.php                  # PHP PDO MySQL Connection & SQLite Fallback
├── api/
│   ├── auth.php                # PHP User Authentication API (Register, Login, Session)
│   ├── foods.php               # PHP Food Listings API (CRUD, Search, Filter, Auto Expiry)
│   ├── requests.php            # PHP Requests API (Multi-User Accept/Reject/Complete)
│   └── dashboard.php           # PHP Impact Dashboard API (Personal & Community Stats)
├── css/
│   └── style.css               # Handcrafted Organic Green CSS3 Design System
├── js/
│   ├── api.js                  # AJAX/Fetch API Connector for PHP Endpoints
│   ├── auth.js                 # Mobile & Email Login Tab Switcher & Forms
│   ├── foods.js                # Marketplace Filter & Food Card Generator
│   ├── requests.js             # Request Approvals Controller
│   ├── dashboard.js            # Real-time Metrics & View Toggle
│   └── script.js               # Master Application Controller
├── schema.sql                  # MySQL Database Export File (Import into phpMyAdmin)
└── *.php                       # All 10 HTML5/PHP Page Views
```
