const mongoose = require('mongoose');
require('dotenv').config();

async function debugSuppliers() {
  try {
    console.log('🔍 Debugging Supplier Search Issue');
    console.log('==================================');
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Import User model
    const User = require('./server/models/User.js');
    
    // Get all suppliers
    const allSuppliers = await User.find({ role: 'supplier' });
    console.log(`📊 Total suppliers in database: ${allSuppliers.length}`);
    console.log('');

    if (allSuppliers.length === 0) {
      console.log('❌ No suppliers found in database!');
      return;
    }

    // Check each supplier's data
    allSuppliers.forEach((supplier, index) => {
      console.log(`\n🔍 Supplier ${index + 1}: ${supplier.businessName}`);
      console.log(`   - ID: ${supplier._id}`);
      console.log(`   - Role: ${supplier.role}`);
      console.log(`   - isVerified: ${supplier.isVerified} (type: ${typeof supplier.isVerified})`);
      console.log(`   - Location: ${supplier.location?.lat}, ${supplier.location?.lng}`);
      console.log(`   - Rating: ${supplier.rating?.average || 0} (${supplier.rating?.count || 0} reviews)`);
      
      // Check available items
      if (supplier.availableItems && supplier.availableItems.length > 0) {
        console.log(`   - Available Items: ${supplier.availableItems.length}`);
        supplier.availableItems.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ${item.name} - ₹${item.price}/${item.unit} (Available: ${item.isAvailable})`);
          console.log(`        Description: ${item.description || 'N/A'}`);
          console.log(`        Category: ${item.category || 'N/A'}`);
        });
      } else {
        console.log(`   - Available Items: NONE (${supplier.availableItems?.length || 0})`);
      }
    });

    // Test search for "tomato"
    console.log('\n🔍 Testing search for "tomato":');
    const searchKeyword = 'tomato';
    
    allSuppliers.forEach(supplier => {
      if (supplier.availableItems && supplier.availableItems.length > 0) {
        const matchingItems = supplier.availableItems.filter(item => {
          if (!item.isAvailable) return false;
          
          const itemName = (item.name || '').toLowerCase();
          const itemDescription = (item.description || '').toLowerCase();
          const itemCategory = (item.category || '').toLowerCase();
          
          return itemName.includes(searchKeyword) || 
                 itemDescription.includes(searchKeyword) || 
                 itemCategory.includes(searchKeyword);
        });
        
        if (matchingItems.length > 0) {
          console.log(`✅ ${supplier.businessName} has ${matchingItems.length} matching items for "${searchKeyword}":`);
          matchingItems.forEach(item => {
            console.log(`   - ${item.name} (${item.category})`);
          });
        } else {
          console.log(`❌ ${supplier.businessName} has no matching items for "${searchKeyword}"`);
          console.log(`   Available items: ${supplier.availableItems.map(item => item.name).join(', ')}`);
        }
      } else {
        console.log(`❌ ${supplier.businessName} has no available items`);
      }
    });

    // Test search for "rice"
    console.log('\n🔍 Testing search for "rice":');
    const searchKeyword2 = 'rice';
    
    allSuppliers.forEach(supplier => {
      if (supplier.availableItems && supplier.availableItems.length > 0) {
        const matchingItems = supplier.availableItems.filter(item => {
          if (!item.isAvailable) return false;
          
          const itemName = (item.name || '').toLowerCase();
          const itemDescription = (item.description || '').toLowerCase();
          const itemCategory = (item.category || '').toLowerCase();
          
          return itemName.includes(searchKeyword2) || 
                 itemDescription.includes(searchKeyword2) || 
                 itemCategory.includes(searchKeyword2);
        });
        
        if (matchingItems.length > 0) {
          console.log(`✅ ${supplier.businessName} has ${matchingItems.length} matching items for "${searchKeyword2}":`);
          matchingItems.forEach(item => {
            console.log(`   - ${item.name} (${item.category})`);
          });
        } else {
          console.log(`❌ ${supplier.businessName} has no matching items for "${searchKeyword2}"`);
        }
      }
    });

    // Check verification status
    console.log('\n🔍 Verification Status Summary:');
    const verifiedSuppliers = allSuppliers.filter(s => s.isVerified === true || s.isVerified === 'true');
    console.log(`✅ Verified suppliers: ${verifiedSuppliers.length}`);
    console.log(`❌ Unverified suppliers: ${allSuppliers.length - verifiedSuppliers.length}`);
    
    if (verifiedSuppliers.length === 0) {
      console.log('⚠️ No verified suppliers found! This explains the search issue.');
    }

    console.log('\n🎯 Recommendations:');
    console.log('1. Check if suppliers have availableItems with correct data');
    console.log('2. Verify item names match search keywords');
    console.log('3. Ensure items are marked as isAvailable: true');
    console.log('4. Consider setting isVerified to true for some suppliers');
    console.log('5. Check if location data is present and correct');

  } catch (error) {
    console.error('❌ Error debugging suppliers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugSuppliers(); 