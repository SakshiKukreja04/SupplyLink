import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplylink';

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📊 URI (masked):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    const conn = await mongoose.connect(MONGODB_URI, {
      // Modern Mongoose connection options (Mongoose 6+)
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Host: ${conn.connection.host}`);
    console.log(`🚀 Port: ${conn.connection.port}`);

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('bad auth')) {
      console.log('\n🔧 Authentication Error - Solutions:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Make sure you\'re using database user credentials, not Atlas account credentials');
      console.log('3. If password contains special characters, URL-encode them');
      console.log('4. Verify the database user has the correct permissions');
      console.log('5. Check your .env file has the correct MONGODB_URI format:');
      console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Network Error - Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the cluster hostname is correct');
      console.log('3. Make sure your IP is whitelisted in Atlas Network Access');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Connection Refused - Solutions:');
      console.log('1. Check if MongoDB is running (for local connections)');
      console.log('2. Verify the connection string format');
      console.log('3. Check firewall settings');
    } else if (error.message.includes('buffermaxentries')) {
      console.log('\n🔧 Configuration Error - Solutions:');
      console.log('1. The bufferMaxEntries option is deprecated and not supported');
      console.log('2. Use only modern Mongoose connection options');
      console.log('3. Check your connection configuration');
    }
    
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🎉 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

export default connectDB; 