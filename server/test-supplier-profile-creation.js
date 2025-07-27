import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplylink';

const testSupplierProfileCreation = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test data similar to what the frontend sends
    const testProfileData = {
      businessName: 'Test Supplier',
      businessType: 'wholesale',
      category: 'raw',
      phone: '9421090371',
      productCategories: ['onion'],
      location: { type: 'Point' } // This is the problematic data
    };

    console.log('\n🧪 Testing supplier profile creation with incomplete location...');
    console.log('Input data:', JSON.stringify(testProfileData, null, 2));

    // Simulate the processing logic from the route
    const cleanProfileData = { ...testProfileData };
    
    // Process location data if provided
    if (cleanProfileData.location) {
      console.log('Processing location data:', JSON.stringify(cleanProfileData.location));
      
      // If location has lat/lng but no coordinates, add them
      if (cleanProfileData.location.lat && cleanProfileData.location.lng && !cleanProfileData.location.coordinates) {
        cleanProfileData.location.coordinates = [cleanProfileData.location.lng, cleanProfileData.location.lat];
        console.log('Added coordinates from lat/lng:', cleanProfileData.location.coordinates);
      }
      // If location has coordinates but no lat/lng, add them
      else if (cleanProfileData.location.coordinates && cleanProfileData.location.coordinates.length === 2 && 
               !cleanProfileData.location.lat && !cleanProfileData.location.lng) {
        cleanProfileData.location.lng = cleanProfileData.location.coordinates[0];
        cleanProfileData.location.lat = cleanProfileData.location.coordinates[1];
        console.log('Added lat/lng from coordinates:', cleanProfileData.location.lat, cleanProfileData.location.lng);
      }
      // If location is incomplete (only has type or missing coordinates), remove it to avoid geospatial errors
      else if (cleanProfileData.location.type && (!cleanProfileData.location.coordinates || cleanProfileData.location.coordinates.length === 0)) {
        console.log('Removing incomplete location data to avoid geospatial errors');
        delete cleanProfileData.location;
      }
      // If location has type but no other data, remove it
      else if (cleanProfileData.location.type && !cleanProfileData.location.lat && !cleanProfileData.location.lng && !cleanProfileData.location.coordinates) {
        console.log('Removing location with only type field to avoid geospatial errors');
        delete cleanProfileData.location;
      }
    }

    console.log('Processed data:', JSON.stringify(cleanProfileData, null, 2));

    // Try to create the supplier
    const testSupplier = new User({
      firebaseUid: 'test-supplier-profile-' + Date.now(),
      role: 'supplier',
      email: 'test@supplier.com',
      ...cleanProfileData
    });

    await testSupplier.save();
    console.log('✅ Supplier profile created successfully!');
    console.log('Created supplier:', JSON.stringify(testSupplier.toObject(), null, 2));

    // Clean up
    await User.findByIdAndDelete(testSupplier._id);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎯 CONCLUSION:');
    console.log('✅ SUPPLIER PROFILE CREATION IS NOW WORKING');
    console.log('   - Incomplete location data is properly handled');
    console.log('   - Geospatial errors are prevented');
    console.log('   - Profile saves successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testSupplierProfileCreation(); 