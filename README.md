# 🎓 Food2Smile - Web Technologies Project (PHP, MySQL, HTML5, CSS3, JS/AJAX, Bootstrap 5)

**Tagline**: *"Turn Surplus into Smiles. ❤️"*  
**Course Alignment**: Web Technologies Syllabus (Modules 1-5: HTML5, CSS3, JavaScript/jQuery AJAX, Bootstrap 5, PHP Web Forms, Sessions, Cookies, and MySQL Database)

---

## 📌 Syllabus Modules Covered

* **Module 1**: HTML5 Document Structure (`.html` files), Semantic Tags, Form Controls, and Inputs.
* **Module 2**: CSS3 Handcrafted Design System, Flexbox/Grid, Micro-animations, JavaScript Functions, Events, and **AJAX / Fetch REST Integration**.
* **Module 3**: Bootstrap 5 Responsive Grid, Navbar, Modals, Tabs, Cards, Badges, and Alerts.
* **Module 4**: PHP Data Handling, Functions, Prepared Statement Logic, and Sanitation.
* **Module 5**: PHP Web Forms, **Sessions & Cookies**, **MySQL Database Integration (`schema.sql`)**, and **PDO Prepared Statements**.

> ⚡ **Strict Compliance**: Node.js, Express.js, MongoDB, and React are completely excluded. The project is 100% PHP + MySQL backend with HTML5 + JS AJAX frontend.

---

## 🗄️ Database Setup (phpMyAdmin / MySQL)

1. Open **phpMyAdmin** in your browser (`http://localhost/phpmyadmin`).
2. Click **New** and create a database named: `food2smile`.
3. Click the **Import** tab.
4. Choose the `schema.sql` file located in the project root folder and click **Import**.

---

## 🚀 How to Run the Application

### Option A: Using XAMPP / WAMP Server (Recommended for College Submissions)
1. Copy the project folder to your local server directory:
   * **XAMPP**: `C:\xampp\htdocs\food2smile`
   * **WAMP**: `C:\wamp64\www\food2smile`
2. Start **Apache** and **MySQL** from the XAMPP / WAMP Control Panel.
3. Open your browser and visit:  
   👉 **`http://localhost/food2smile/index.html`**

### Option B: Built-in PHP Server (Zero-Config Test)
1. Open Command Prompt or PowerShell inside the project root directory.
2. Run the following command:
   ```bash
   php -S localhost:8000
   ```
3. Open your browser and visit:  
   👉 **`http://localhost:8000`**

---

## 🔑 Demo Credentials

| Login Identifier | Password | Role |
| :--- | :--- | :--- |
| `9876543210` / `funpanda06@gmail.com` | `password123` | Main User (Ananya Sharma) |
| `9876543211` / `priya@gmail.com` | `password123` | Secondary User (Priya Verma) |

---

## 📁 Project File Architecture

```
Food2Smile/
├── config/
│   └── db.php                  # PHP PDO Connection (MySQL with SQLite fallback)
├── api/
│   ├── auth.php                # PHP Session Auth API (Register, Login, Logout)
│   ├── foods.php               # PHP Food CRUD & Expiry Logic API
│   ├── requests.php            # PHP Multi-User Request Actions API
│   └── dashboard.php           # PHP Impact Dashboard Statistics API
├── css/
│   └── style.css               # Handcrafted Organic Green CSS3 Theme
├── js/
│   ├── api.js                  # AJAX Fetch API Wrapper for PHP endpoints
│   ├── auth.js                 # Auth Controller & Phone/Email Tab Switcher
│   ├── foods.js                # Food Card Renderer & Filter Logic
│   ├── requests.js             # Request Approvals Controller
│   ├── dashboard.js            # Real-time Analytics Controller
│   └── script.js               # Master Application Controller
├── schema.sql                  # MySQL Database Schema & Initial Data
├── index.html                  # Homepage View
├── find-food.html              # Find Food Marketplace
├── share-food.html             # Share Surplus Food Form
├── going-away.html             # Going Away Perishables Form
├── food-details.html           # Food Item Details Page
├── my-foods.html               # My Listed Foods Management
├── requests.html               # Incoming & Sent Food Requests
├── dashboard.html              # Impact Dashboard
├── login.html                  # User Login Page
└── register.html               # User Registration Page
```
