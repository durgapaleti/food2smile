# Food2Smile - Full-Stack Surplus Food Sharing Application

**Tagline**: *"Turn Surplus into Smiles. ❤️"*

Food2Smile is a full-stack surplus food-sharing web application built for a college Web Technologies project using **Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, bcryptjs, Multer/Cloudinary, HTML5, CSS3, JavaScript (Fetch API), and Bootstrap 5**.

---

## 📁 1. Project Directory Structure

```
Food2Smile/
├── frontend/
│   ├── index.html          # Homepage & Surplus Spotlight
│   ├── find-food.html      # Food Marketplace with Live Search, Categories, Filters & Sorting
│   ├── share-food.html     # Share Surplus Food Form (Sell, Discount 30-50%, Free, Donate)
│   ├── going-away.html     # Going Away Listing Form (Spoiling Date Alerts)
│   ├── food-details.html   # Listing Details & Food Request Form
│   ├── my-foods.html       # Owner Listing Management (Available, Requested, Completed, Expired)
│   ├── requests.html       # Request Center ("My Requests" & "Requests for My Food")
│   ├── dashboard.html      # Real-Time MongoDB Impact Statistics & Aggregations
│   ├── login.html          # User Authentication Login Form
│   ├── register.html       # New User Account Registration Form
│   ├── css/
│   │   └── style.css       # Handcrafted Custom CSS Design System
│   └── js/
│       ├── api.js          # REST API Fetch client wrapper with JWT token management
│       ├── auth.js         # JWT Authentication, Session & User Avatar Renderer
│       ├── foods.js        # REST Food API calls, discount math & card renderer
│       ├── requests.js     # REST Requests API calls (Accept/Reject/Complete)
│       ├── dashboard.js    # MongoDB dashboard statistics renderer
│       └── script.js       # Master DOM event binding controller
│
├── backend/
│   ├── server.js            # Express application entry point & static file server
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose connection connector
│   ├── models/
│   │   ├── User.js          # Mongoose User Schema (hashed passwords)
│   │   ├── Food.js          # Mongoose Food Schema (owner ref, pricing, status, spoilingDate)
│   │   └── Request.js       # Mongoose Request Schema (food ref, requester ref, owner ref, status)
│   ├── routes/
│   │   ├── authRoutes.js    # /api/auth endpoints (register, login, me)
│   │   ├── foodRoutes.js    # /api/foods endpoints (CRUD, search, filter, sort)
│   │   ├── requestRoutes.js # /api/requests endpoints (create, accept, reject, complete)
│   │   └── userRoutes.js    # /api/users endpoints (profile, dashboard stats)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── foodController.js
│   │   ├── requestController.js
│   │   └── userController.js
│   └── middleware/
│       ├── authMiddleware.js # JWT Bearer token authentication guard
│       └── uploadMiddleware.js # Multer/Cloudinary image upload middleware
│
├── .env
├── .env.example            # Secrets & connection configuration template
├── package.json            # Node.js dependencies & scripts
└── README.md               # Full-Stack setup & execution documentation
```

---

## 🛠️ 2. Quick Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local Community Edition or MongoDB Atlas cloud cluster)

---

## 📦 3. Installation (`npm install`)

Open terminal inside the project directory (`Food2Smile/`) and run:

```bash
npm install
```

This installs all dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `multer`, `cloudinary`, `multer-storage-cloudinary`, and `nodemon`.

---

## 🍃 4. How to Configure MongoDB Atlas (Cloud Database)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (Free M0 Tier).
3. Under **Database Access**, create a database user with password.
4. Under **Network Access**, add IP address `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Connect your application** and copy your Connection String URI:
   ```
   mongodb+cluster0.example.mongodb.net/food2smile?retryWrites=true&w=majority
   ```

---

## ☁️ 5. How to Configure Cloudinary (Image Storage)

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. From your Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.

---

## 🔐 6. How to Create `.env`

Create a file named `.env` in the root folder (`Food2Smile/`) using `.env.example` as reference:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/food2smile
JWT_SECRET=food2smile_super_secret_jwt_key_2026

# Cloudinary Setup (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🚀 7. How to Start Backend Server

To start the full-stack server:

```bash
npm start
```

Or for automatic live reload during development:

```bash
npm run dev
```

The Express server will start on port **5000**:
```
🚀 Food2Smile Full-Stack Server running on port 5000
🌐 Frontend URL: http://localhost:5000
📡 REST API Base: http://localhost:5000/api
```

---

## 🌐 8. How to Open Frontend Application

Open your browser and visit:

```
http://localhost:5000
```

---

## 📡 9. REST API Endpoint Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (bcrypt password hash + JWT) |
| `POST` | `/api/auth/login` | Public | Login with email/phone & password |
| `GET` | `/api/auth/me` | Private | Get current user profile |

### Foods (`/api/foods`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/foods` | Public | Fetch available foods (supports `?search=`, `?category=`, `?action=`, `?sort=`) |
| `GET` | `/api/foods/my` | Private | Fetch foods owned by logged-in user |
| `GET` | `/api/foods/:id` | Public | Fetch detailed food listing by ID |
| `POST` | `/api/foods` | Private | Create new food listing (image upload supported) |
| `PUT` | `/api/foods/:id` | Private | Update food listing (owner only) |
| `DELETE` | `/api/foods/:id` | Private | Delete food listing (owner only) |

### Requests (`/api/requests`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/requests` | Private | Submit food request (owner cannot request own food) |
| `GET` | `/api/requests/my` | Private | Fetch sent requests |
| `GET` | `/api/requests/received` | Private | Fetch received requests for owner's food |
| `PUT` | `/api/requests/:id/accept` | Private | Accept request (sets request status `ACCEPTED` & food status `REQUESTED`) |
| `PUT` | `/api/requests/:id/reject` | Private | Reject request (sets request status `REJECTED`) |
| `PUT` | `/api/requests/:id/complete` | Private | Complete transaction (sets request status `COMPLETED` & food status `SOLD`/`GIVEN`/`DONATED`/`COMPLETED`) |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Private | Compute MongoDB stats (Listed, Available, Sold, Given, Donated, Saved) |

---

## 🧪 10. End-to-End Multi-User Testing Checklist

- [x] **Registration & Password Hashing**: Register User A (`userA@example.com`). Check database to ensure password is strictly hashed with `bcryptjs`.
- [x] **JWT Token Storage**: Verify token is stored securely in client state and sent in `Authorization: Bearer <token>` headers.
- [x] **Food Listing & Expiry**: User A lists food. Check that `spoilingDate < today` automatically flags status as `EXPIRED` and purges it from `find-food.html`.
- [x] **Multi-User Real Interaction**: User B logs in on another browser session, views User A's food, and submits a request.
- [x] **Owner Action & Status Synchronization**: User A accepts the request -> Food status updates to `REQUESTED`. User A marks as completed -> Food status updates to `SOLD`/`GIVEN`/`DONATED`.
- [x] **MongoDB Analytics Aggregations**: Verify that `dashboard.html` metrics accurately compute counts directly from the backend.
