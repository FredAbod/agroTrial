/**
 * Database seeder utility for creating initial test data
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Item = require('../models/Item');
const Category = require('../models/Category');
const Location = require('../models/Location');
const config = require('../config');
const logger = require('./logger');

// Sample categories
const categories = [
  { name: 'Vegetables', description: 'Fresh vegetables', icon: '🥦' },
  { name: 'Fruits', description: 'Fresh fruits', icon: '🍎' },
  { name: 'Meat', description: 'Fresh meat products', icon: '🥩' },
  { name: 'Dairy', description: 'Fresh dairy products', icon: '🥛' },
  { name: 'Eggs', description: 'Farm fresh eggs', icon: '🥚' },
  { name: 'Grains', description: 'Whole and processed grains', icon: '🌾' }
];

// Sample locations
const locations = [
  { 
    name: 'Lagos Central',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    coordinates: [3.3792, 6.4550],
    zipCode: '100001',
    deliveryFee: 500
  },
  { 
    name: 'Abuja Central',
    city: 'Abuja',
    state: 'FCT',
    country: 'Nigeria',
    coordinates: [7.4951, 9.0579],
    zipCode: '900001',
    deliveryFee: 450
  },
  { 
    name: 'Ibadan',
    city: 'Ibadan',
    state: 'Oyo',
    country: 'Nigeria',
    coordinates: [3.8999, 7.3776],
    zipCode: '200001',
    deliveryFee: 600
  }
];

// Sample users
const users = [
  {
    name: 'John Consumer',
    email: 'consumer@example.com',
    password: 'password123',
    role: 'consumer',
    phoneNumber: '+2348012345678',
    location: 'Lagos, Nigeria'
  },
  {
    name: 'Jane Farmer',
    email: 'farmer@example.com',
    password: 'password123',
    role: 'farmer',
    phoneNumber: '+2348087654321',
    location: 'Ibadan, Nigeria',
    farmerData: {
      farmName: "Jane's Organic Farm",
      description: "We grow the best organic produce in Oyo State",
      location: {
        address: 'Ibadan, Oyo State, Nigeria',
        coordinates: [3.8999, 7.3776]
      },
      productCategories: ['vegetables', 'fruits'],
      farmPhotos: ['https://example.com/farm1.jpg', 'https://example.com/farm2.jpg']
    }
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpass123',
    role: 'admin',
    phoneNumber: '+2348099887766',
    location: 'Abuja, Nigeria'
  }
];

// Sample items
const createItems = (farmerId) => [
  {
    name: 'Organic Tomatoes',
    description: 'Fresh organic tomatoes grown without pesticides',
    category: 'vegetables',
    price: 350,
    unit: 'kg',
    quantity: 50,
    farmerId,
    images: ['https://example.com/tomatoes.jpg'],
    organic: true
  },
  {
    name: 'Fresh Eggs',
    description: 'Farm fresh eggs from free-range chickens',
    category: 'eggs',
    price: 1200,
    unit: 'dozen',
    quantity: 30,
    farmerId,
    images: ['https://example.com/eggs.jpg'],
    organic: true
  },
  {
    name: 'Sweet Corn',
    description: 'Locally grown sweet corn, perfect for roasting',
    category: 'vegetables',
    price: 250,
    unit: 'piece',
    quantity: 100,
    farmerId,
    images: ['https://example.com/corn.jpg'],
    organic: false
  }
];

/**
 * Seed the database with initial data
 */
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    mongoose.connect(config.MONGODB_URI)
      .then(() => logger.info('Connected to MongoDB for seeding'))
      .catch(err => {
        logger.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
      });
      
    // Clear existing data
    await User.deleteMany({});
    await Farmer.deleteMany({});
    await Item.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    
    logger.info('Cleared existing data');
    
    // Create categories
    await Category.insertMany(categories);
    logger.info('Created categories');
    
    // Create locations
    await Location.insertMany(locations);
    logger.info('Created locations');
    
    // Create users and related data
    for (const userData of users) {
      const { farmerData, ...userInfo } = userData;
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      userInfo.password = await bcrypt.hash(userInfo.password, salt);
      
      const user = await User.create(userInfo);
      
      // If user is a farmer, create farmer profile and items
      if (user.role === 'farmer' && farmerData) {
        const farmer = await Farmer.create({
          userId: user._id,
          ...farmerData
        });
        
        // Create sample items for this farmer
        const items = createItems(farmer._id);
        await Item.insertMany(items);
        
        // Update farmer's active listings count
        farmer.activeListingsCount = items.length;
        await farmer.save();
        
        logger.info(`Created farmer ${farmer.farmName} with ${items.length} items`);
      }
    }
    
    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;