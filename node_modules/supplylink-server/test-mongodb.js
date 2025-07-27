import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  console.log('📝 Please create a .env file in the server directory with:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/supplylink?retryWrites=true&w=majority');
  process.exit(1);
}

console.log('🔗 Testing MongoDB connection...');
console.log('📊 URI (masked):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const testConnection = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Modern Mongoose connection options (Mongoose 6+)
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Host: ${conn.connection.host}`);
    console.log(`🚀 Port: ${conn.connection.port}`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📋 Collections found: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.log('\n🔧 Authentication Error - Common Solutions:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Make sure you\'re using database user credentials, not Atlas account credentials');
      console.log('3. If password contains special characters, URL-encode them');
      console.log('4. Verify the database user has the correct permissions');
      console.log('5. Check your .env file has the correct MONGODB_URI format:');
      console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Network Error - Common Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the cluster hostname is correct');
      console.log('3. Make sure your IP is whitelisted in Atlas Network Access');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Connection Refused - Common Solutions:');
      console.log('1. Check if MongoDB is running (for local connections)');
      console.log('2. Verify the connection string format');
      console.log('3. Check firewall settings');
    } else if (error.message.includes('buffermaxentries')) {
      console.log('\n🔧 Configuration Error - Common Solutions:');
      console.log('1. The bufferMaxEntries option is deprecated and not supported');
      console.log('2. Use only modern Mongoose connection options');
      console.log('3. Check your connection configuration');
    }
    
    process.exit(1);
  }
};

testConnection(); 