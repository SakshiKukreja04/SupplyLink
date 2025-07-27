const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Import models
const Vendor = require('./server/models/Vendor.js');
const Review = require('./server/models/Review.js');

const fixVendorData = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking vendor data in MongoDB...');
    console.log('=====================================');
    
    // Get all vendors
    const vendors = await Vendor.find({});
    console.log(`📊 Found ${vendors.length} vendors in database`);
    
    if (vendors.length === 0) {
      console.log('ℹ️ No vendors found. This is normal if no vendors have signed up yet.');
      return;
    }
    
    console.log('\n📋 Vendor Data Analysis:');
    console.log('========================');
    
    let problematicVendors = 0;
    
    vendors.forEach((vendor, index) => {
      console.log(`\n${index + 1}. Vendor ID: ${vendor._id}`);
      console.log(`   Firebase UID: ${vendor.firebaseUid}`);
      console.log(`   Name: "${vendor.name}"`);
      console.log(`   Email: "${vendor.email}"`);
      console.log(`   Phone: "${vendor.phone}"`);
      
      // Check for problematic data
      const issues = [];
      if (!vendor.name || vendor.name === 'Vendor' || vendor.name === 'Vendor User') {
        issues.push('❌ Invalid name');
      }
      if (!vendor.email || vendor.email.includes('@vendor.com') || vendor.email.includes('@firebase')) {
        issues.push('❌ Invalid email');
      }
      if (!vendor.phone || vendor.phone.trim() === '') {
        issues.push('❌ Missing phone');
      }
      
      if (issues.length > 0) {
        problematicVendors++;
        console.log(`   Issues: ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ Data looks good`);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total vendors: ${vendors.length}`);
    console.log(`   Problematic vendors: ${problematicVendors}`);
    console.log(`   Good vendors: ${vendors.length - problematicVendors}`);
    
    if (problematicVendors > 0) {
      console.log('\n⚠️ Found vendors with problematic data!');
      console.log('This explains why reviews show "Vendor User" and Firebase-generated emails.');
      console.log('\n💡 Solutions:');
      console.log('1. Delete problematic vendors and have them re-register');
      console.log('2. Update vendor data manually in MongoDB');
      console.log('3. Implement data migration script');
    } else {
      console.log('\n✅ All vendor data looks good!');
      console.log('The issue might be in the signup process or review display.');
    }
    
    // Check reviews
    console.log('\n🔍 Checking review data...');
    console.log('==========================');
    
    const reviews = await Review.find({});
    console.log(`📊 Found ${reviews.length} reviews in database`);
    
    if (reviews.length > 0) {
      console.log('\n📋 Recent Reviews:');
      reviews.slice(0, 5).forEach((review, index) => {
        console.log(`\n${index + 1}. Review ID: ${review._id}`);
        console.log(`   Vendor Name: "${review.vendorName}"`);
        console.log(`   Vendor Email: "${review.vendorEmail}"`);
        console.log(`   Rating: ${review.rating}/5`);
        console.log(`   Comment: "${review.comment}"`);
        console.log(`   Created: ${review.createdAt}`);
      });
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test vendor signup with new account');
    console.log('2. Check browser and server logs');
    console.log('3. Verify vendor data in MongoDB');
    console.log('4. Submit review and check display');
    
  } catch (error) {
    console.error('❌ Error fixing vendor data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
};

// Run the fix
fixVendorData(); 