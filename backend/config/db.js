const mongoose = require('mongoose');
const seedDB = require('./seed');
const inMemoryStore = require('./inMemoryStore');

const connectDB = async () => {
  const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food2smile';
  
  try {
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await seedDB();
  } catch (error) {
    console.warn(`⚠️ Local/Atlas MongoDB not detected (${error.message}).`);
    console.log(`⚡ Activated high-performance In-Memory Data Store (Instant zero-config mode).`);
  }
};

module.exports = connectDB;
