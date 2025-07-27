import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplylink';

const testSpecificSupplierLocation = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const supplierId = '6885577acabf2efb1f107fd5';
    const firebaseUid = 'Ls1IfVQYh8eDLwCskNdEoMCD1Pg2';

    console.log(`\n🔍 Checking supplier with ID: ${supplierId}`);
    console.log(`Firebase UID: ${firebaseUid}`);

    // Find the supplier
    const supplier = await User.findById(supplierId);
    
    if (!supplier) {
      console.log('❌ Supplier not found');
      return;
    }

    console.log('\n📋 Current supplier data:');
    console.log(JSON.stringify(supplier.toObject(), null, 2));

    // Check if location exists
    if (supplier.location) {
      console.log('\n✅ Location field exists:');
      console.log(JSON.stringify(supplier.location, null, 2));
    } else {
      console.log('\n❌ Location field is missing');
      
      // Add test location data
      console.log('\n🧪 Adding test location data...');
      
      const testLocation = {
        type: 'Point',
        coordinates: [72.8777, 19.076], // Mumbai coordinates
        lat: 19.076,
        lng: 72.8777,
        address: 'Mumbai, Maharashtra, India',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      };

      const updatedSupplier = await User.findByIdAndUpdate(
        supplierId,
        { 
          location: testLocation,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (updatedSupplier) {
        console.log('✅ Location added successfully!');
        console.log('Updated supplier:', JSON.stringify(updatedSupplier.toObject(), null, 2));
      } else {
        console.log('❌ Failed to update supplier');
      }
    }

    // Test location update via API route logic
    console.log('\n🧪 Testing location update via API route logic...');
    
    const testLocationData = {
      lat: 19.076,
      lng: 72.8777,
      address: 'Mumbai, Maharashtra, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400001'
    };

    // Simulate the processing logic from the route
    const cleanLocationData = { ...testLocationData };
    
    // Process location data
    if (cleanLocationData.lat && cleanLocationData.lng) {
      cleanLocationData.coordinates = [cleanLocationData.lng, cleanLocationData.lat];
      cleanLocationData.type = 'Point';
      console.log('Processed location data:', JSON.stringify(cleanLocationData, null, 2));
    }

    const updatedSupplier2 = await User.findByIdAndUpdate(
      supplierId,
      { 
        location: cleanLocationData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (updatedSupplier2) {
      console.log('✅ Location updated via API logic successfully!');
      console.log('Final supplier data:', JSON.stringify(updatedSupplier2.toObject(), null, 2));
    } else {
      console.log('❌ Failed to update supplier via API logic');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testSpecificSupplierLocation(); 