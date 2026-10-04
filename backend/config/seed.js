const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Food = require('../models/Food');

const seedDB = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('🌱 Database already seeded.');
      return;
    }

    console.log('🌱 Seeding initial demo users and food listings...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const user1 = await User.create({
      name: 'Ananya Sharma',
      email: 'funpanda06@gmail.com',
      phone: '9876543210',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    });

    const user2 = await User.create({
      name: 'Priya Verma',
      email: 'priya@gmail.com',
      phone: '9876543211',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    });

    const user3 = await User.create({
      name: 'Aarav Patel',
      email: 'aarav@gmail.com',
      phone: '9876543212',
      password: hashedPassword,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    });

    const today = new Date();
    const addDays = (days) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const initialFoods = [
      {
        owner: user1._id,
        ownerName: user1.name,
        name: 'Fresh Organic Tomatoes',
        category: 'Vegetables',
        quantity: '3 kg',
        location: 'Koramangala, Bangalore',
        originalPrice: 120,
        action: 'Free',
        discount: 100,
        finalPrice: 0,
        deliveryOption: 'Self Pickup',
        spoilingDate: addDays(2),
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
        description: 'Harvested yesterday from home garden. Excess quantity before going away on weekend trip.',
        status: 'Available'
      },
      {
        owner: user2._id,
        ownerName: user2.name,
        name: 'Whole Wheat Fresh Bread',
        category: 'Bakery',
        quantity: '2 Loaves',
        location: 'Indiranagar, Bangalore',
        originalPrice: 90,
        action: 'Discount',
        discount: 50,
        finalPrice: 45,
        deliveryOption: 'Self Pickup',
        spoilingDate: addDays(1),
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        description: 'Freshly baked artisanal whole wheat bread. Best consumed within 2 days.',
        status: 'Available'
      },
      {
        owner: user3._id,
        ownerName: user3.name,
        name: 'Alphonso Mangoes',
        category: 'Fruits',
        quantity: '5 kg',
        location: 'Whitefield, Bangalore',
        originalPrice: 600,
        action: 'Sell',
        discount: 30,
        finalPrice: 420,
        deliveryOption: 'Home Delivery',
        spoilingDate: addDays(4),
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80',
        description: 'Sweet juicy mangoes straight from Ratnagiri orchard.',
        status: 'Available'
      },
      {
        owner: user1._id,
        ownerName: user1.name,
        name: 'Homemade Paneer Butter Masala',
        category: 'Cooked Food',
        quantity: '3 Portions',
        location: 'Koramangala, Bangalore',
        originalPrice: 300,
        action: 'Donate',
        discount: 100,
        finalPrice: 0,
        deliveryOption: 'Self Pickup',
        spoilingDate: addDays(1),
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80',
        description: 'Cooked fresh for party, leftover unserved portions stored in hygienic food containers.',
        status: 'Available'
      }
    ];

    await Food.insertMany(initialFoods);
    console.log('✅ Initial demo users and food listings seeded successfully!');
  } catch (error) {
    console.error('⚠️ Seeding error:', error.message);
  }
};

module.exports = seedDB;
