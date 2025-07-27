import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Supplier from './models/Supplier.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplylink';

const cleanupDummyData = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📊 URI (masked):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${conn.connection.name}`);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Found collections:', collections.map(c => c.name));

    // Clean up dummy data from specific collections
    const cleanupTasks = [];

    // Clean up Users collection (remove sample users)
    if (collections.find(c => c.name === 'users')) {
      const sampleUserCount = await User.countDocuments({
        firebaseUid: { $regex: /^sample-/ }
      });
      if (sampleUserCount > 0) {
        console.log(`🗑️  Removing ${sampleUserCount} sample users...`);
        const result = await User.deleteMany({
          firebaseUid: { $regex: /^sample-/ }
        });
        console.log(`✅ Removed ${result.deletedCount} sample users`);
      }
    }

    // Clean up any other collections with dummy data
    const collectionsToCheck = ['suppliers', 'vendors', 'products', 'materials', 'orders'];
    
    for (const collectionName of collectionsToCheck) {
      if (collections.find(c => c.name === collectionName)) {
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Check for documents with sample/test data indicators
        const sampleCount = await collection.countDocuments({
          $or: [
            { email: { $regex: /@example\.com$/ } },
            { name: { $regex: /sample|test|dummy/i } },
            { businessName: { $regex: /sample|test|dummy/i } }
          ]
        });
        
        if (sampleCount > 0) {
          console.log(`🗑️  Removing ${sampleCount} sample documents from ${collectionName}...`);
          const result = await collection.deleteMany({
            $or: [
              { email: { $regex: /@example\.com$/ } },
              { name: { $regex: /sample|test|dummy/i } },
              { businessName: { $regex: /sample|test|dummy/i } }
            ]
          });
          console.log(`✅ Removed ${result.deletedCount} sample documents from ${collectionName}`);
        }
      }
    }

    // Show final collection stats
    console.log('\n📊 Final collection statistics:');
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('🎉 Your database is now clean and ready for real data.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run cleanup
cleanupDummyData(); 