import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Debug endpoint to check suppliers in database
router.get('/suppliers', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking suppliers in database...');
    
    // Get all suppliers
    const suppliers = await User.find({ role: 'supplier' }).select('businessName availableItems location rating isVerified');
    
    console.log(`📊 Found ${suppliers.length} suppliers in database`);
    
    // Check suppliers with availableItems
    const suppliersWithItems = suppliers.filter(s => s.availableItems && s.availableItems.length > 0);
    console.log(`📦 ${suppliersWithItems.length} suppliers have availableItems`);
    
    // Check for specific items
    const onionSuppliers = suppliers.filter(s => 
      s.availableItems && s.availableItems.some(item => 
        item.name && item.name.toLowerCase().includes('onion')
      )
    );
    console.log(`🧅 ${onionSuppliers.length} suppliers have onion-related items`);
    
    // Sample data for debugging
    const sampleSuppliers = suppliers.slice(0, 3).map(s => ({
      businessName: s.businessName,
      availableItemsCount: s.availableItems?.length || 0,
      sampleItems: s.availableItems?.slice(0, 2).map(item => ({
        name: item.name,
        category: item.category,
        isAvailable: item.isAvailable
      })) || [],
      location: s.location,
      rating: s.rating,
      isVerified: s.isVerified
    }));
    
    res.json({
      success: true,
      totalSuppliers: suppliers.length,
      suppliersWithItems: suppliersWithItems.length,
      onionSuppliers: onionSuppliers.length,
      sampleSuppliers,
      allSuppliers: suppliers.map(s => ({
        businessName: s.businessName,
        availableItemsCount: s.availableItems?.length || 0,
        location: s.location,
        rating: s.rating,
        isVerified: s.isVerified
      }))
    });
  } catch (error) {
    console.error('Debug suppliers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to test search query
router.post('/test-search', async (req, res) => {
  try {
    const { keyword, lat, lng, maxDistance, minRating, verifiedOnly } = req.body;
    
    console.log('🔍 Debug: Testing search query...', { keyword, lat, lng, maxDistance, minRating, verifiedOnly });
    
    // Test the exact search query from vendorController
    const searchQuery = {
      role: 'supplier',
      isVerified: verifiedOnly ? true : { $in: [true, false] }
    };

    if (keyword && keyword.trim()) {
      const searchKeyword = keyword.trim().toLowerCase();
      searchQuery['availableItems'] = {
        $elemMatch: {
          $or: [
            { name: { $regex: searchKeyword, $options: 'i' } },
            { description: { $regex: searchKeyword, $options: 'i' } },
            { category: { $regex: searchKeyword, $options: 'i' } }
          ],
          isAvailable: true
        }
      };
    }

    console.log('🔍 Search query:', JSON.stringify(searchQuery, null, 2));

    const suppliersWithMaterials = await User.find(searchQuery);
    console.log(`📊 Found ${suppliersWithMaterials.length} suppliers with materials`);

    // Test distance calculation
    const nearbySuppliers = suppliersWithMaterials.filter(supplier => {
      if (!supplier.location || !supplier.location.lat || !supplier.location.lng) {
        return false;
      }
      
      const distance = calculateDistance(lat, lng, supplier.location.lat, supplier.location.lng);
      return distance <= maxDistance;
    });

    console.log(`📍 Found ${nearbySuppliers.length} nearby suppliers after distance filtering`);

    // Test rating filter
    const ratedSuppliers = nearbySuppliers.filter(s => s.rating?.average >= minRating);
    console.log(`⭐ Found ${ratedSuppliers.length} suppliers after rating filtering`);

    res.json({
      success: true,
      searchQuery,
      suppliersWithMaterials: suppliersWithMaterials.length,
      nearbySuppliers: nearbySuppliers.length,
      ratedSuppliers: ratedSuppliers.length,
      finalResults: ratedSuppliers.map(s => ({
        businessName: s.businessName,
        availableItemsCount: s.availableItems?.length || 0,
        rating: s.rating,
        location: s.location,
        isVerified: s.isVerified
      }))
    });
  } catch (error) {
    console.error('Debug test-search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router; 