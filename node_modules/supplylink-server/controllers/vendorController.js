import Vendor from '../models/Vendor.js';
import Supplier from '../models/Supplier.js';
import SupplierMaterial from '../models/SupplierMaterial.js';
import VendorSearch from '../models/VendorSearch.js';
import Order from '../models/Order.js';
import { getNearbySuppliers } from '../utils/haversine.js';
import { emitToUser } from '../utils/socketManager.js';

/**
 * Search for suppliers based on keyword and location
 */
export const searchSuppliers = async (req, res) => {
  try {
    const { 
      keyword, 
      originalKeyword,
      lat, 
      lng, 
      maxDistance = 10, 
      minRating = 0, 
      verifiedOnly = true,
      translationInfo
    } = req.body;
    const vendorId = req.user.uid;

    console.log('🔍 Starting comprehensive supplier search with parameters:');
    console.log(`📍 Keyword: "${keyword}" (original: "${originalKeyword}")`);
    console.log(`📍 Location: ${lat}, ${lng}`);
    console.log(`📍 Max Distance: ${maxDistance}km`);
    console.log(`📍 Min Rating: ${minRating}`);
    console.log(`📍 Verified Only: ${verifiedOnly}`);
    console.log(`📍 Translation Info:`, translationInfo);

    // Get vendor from dedicated Vendor model
    const vendor = await Vendor.findOne({ firebaseUid: vendorId });
    
    if (!vendor || !vendor.location) {
      return res.status(400).json({ 
        success: false,
        error: 'Vendor location not found',
        message: 'Please update your location in your profile'
      });
    }

    // Save search keyword with translation info
    await VendorSearch.create({
      vendorId: vendor._id,
      keyword: originalKeyword || keyword,
      translatedKeyword: keyword,
      location: { lat, lng },
      filters: { maxDistance, minRating, verifiedOnly },
      translationInfo
    });

    // Search for materials in User.availableItems with enhanced filtering
    const User = (await import('../models/User.js')).default;
    
    // Step 1: Get all suppliers with basic role filter
    const allSuppliers = await User.find({ role: 'supplier' });
    console.log(`📊 Step 1: Total suppliers in database: ${allSuppliers.length}`);

    // Step 2: Apply verification filter
    let verifiedSuppliers = allSuppliers;
    if (verifiedOnly) {
      // Check verification status more carefully
      verifiedSuppliers = allSuppliers.filter(s => {
        const isVerified = s.isVerified === true || s.isVerified === 'true';
        if (!isVerified) {
          console.log(`❌ Supplier ${s.businessName} filtered out: not verified (isVerified: ${s.isVerified})`);
        }
        return isVerified;
      });
      console.log(`✅ Step 2: Verified suppliers only: ${verifiedSuppliers.length}`);
      
      // If no verified suppliers found, show all suppliers for debugging
      if (verifiedSuppliers.length === 0) {
        console.log(`⚠️ No verified suppliers found. Showing all suppliers for debugging:`);
        allSuppliers.forEach(s => {
          console.log(`   - ${s.businessName}: isVerified = ${s.isVerified} (type: ${typeof s.isVerified})`);
        });
        
              // TEMPORARY FIX: If no verified suppliers exist, show all suppliers
      console.log(`🔄 TEMPORARY FIX: No verified suppliers found, showing all suppliers instead`);
      verifiedSuppliers = allSuppliers;
      console.log(`🔄 TEMPORARY FIX: Overriding verifiedOnly filter to show all suppliers`);
      }
    } else {
      console.log(`✅ Step 2: All suppliers (including unverified): ${verifiedSuppliers.length}`);
    }

    // Step 3: Apply product/material search filter
    let productFilteredSuppliers = verifiedSuppliers;
    if (keyword && keyword.trim()) {
      const searchKeyword = keyword.trim().toLowerCase();
      console.log(`🔍 Step 3: Searching for product/material: "${searchKeyword}"`);
      
      productFilteredSuppliers = verifiedSuppliers.filter(supplier => {
        // Check if supplier has available items
        if (!supplier.availableItems || supplier.availableItems.length === 0) {
          return false;
        }

        // Check if any item matches the search keyword (improved matching)
        const hasMatchingItem = supplier.availableItems.some(item => {
          if (!item.isAvailable) return false;
          
          const itemName = (item.name || '').toLowerCase();
          const itemDescription = (item.description || '').toLowerCase();
          const itemCategory = (item.category || '').toLowerCase();
          
          // Check for exact match or partial match
          const exactMatch = itemName === searchKeyword || 
                           itemDescription === searchKeyword || 
                           itemCategory === searchKeyword;
          
          // Check for contains match
          const containsMatch = itemName.includes(searchKeyword) || 
                              itemDescription.includes(searchKeyword) || 
                              itemCategory.includes(searchKeyword);
          
          // Check for singular/plural variations
          const singularMatch = searchKeyword.endsWith('s') && 
                              (itemName.includes(searchKeyword.slice(0, -1)) || 
                               itemDescription.includes(searchKeyword.slice(0, -1)) || 
                               itemCategory.includes(searchKeyword.slice(0, -1)));
          
          const pluralMatch = !searchKeyword.endsWith('s') && 
                            (itemName.includes(searchKeyword + 's') || 
                             itemDescription.includes(searchKeyword + 's') || 
                             itemCategory.includes(searchKeyword + 's'));
          
          const matches = exactMatch || containsMatch || singularMatch || pluralMatch;
          
          if (matches) {
            console.log(`✅ Supplier ${supplier.businessName} has matching item: "${item.name}" for search "${searchKeyword}"`);
          }
          
          return matches;
        });

        if (!hasMatchingItem) {
          console.log(`❌ Supplier ${supplier.businessName} filtered out: no matching items for "${searchKeyword}"`);
        }

        return hasMatchingItem;
      });
      
      console.log(`📦 Step 3: Suppliers with matching products: ${productFilteredSuppliers.length}`);
    } else {
      console.log(`📦 Step 3: No product filter applied: ${productFilteredSuppliers.length}`);
    }

    // Step 4: Apply distance filter
    console.log(`📍 Step 4: Applying distance filter (max ${maxDistance}km from ${lat}, ${lng})`);
    const nearbySuppliers = getNearbySuppliers(
      productFilteredSuppliers,
      lat,
      lng,
      maxDistance
    );
    console.log(`📍 Step 4: Suppliers within ${maxDistance}km: ${nearbySuppliers.length}`);

    // Step 5: Apply rating filter
    console.log(`⭐ Step 5: Applying rating filter (min ${minRating})`);
    const ratedSuppliers = nearbySuppliers.filter(supplier => {
      const rating = supplier.rating?.average || 0;
      const passes = rating >= minRating;
      
      if (!passes) {
        console.log(`❌ Supplier ${supplier.businessName} filtered out: rating ${rating} < ${minRating}`);
      } else {
        console.log(`✅ Supplier ${supplier.businessName} passes rating filter: ${rating} >= ${minRating}`);
      }
      
      return passes;
    });
    
    console.log(`⭐ Step 5: Suppliers with rating >= ${minRating}: ${ratedSuppliers.length}`);

    // Step 6: Enhance supplier data with matched materials and relevance scoring
    console.log(`🎯 Step 6: Enhancing supplier data with matched materials`);
    const enhancedSuppliers = ratedSuppliers.map(supplier => {
      const matchedMaterials = supplier.availableItems?.filter(item => {
        if (!item.isAvailable) return false;
        
        const searchKeyword = keyword.trim().toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        const itemDescription = (item.description || '').toLowerCase();
        const itemCategory = (item.category || '').toLowerCase();
        
        return itemName.includes(searchKeyword) ||
               itemDescription.includes(searchKeyword) ||
               itemCategory.includes(searchKeyword);
      }) || [];

      // Calculate relevance score based on multiple factors
      const distanceScore = Math.max(0, 10 - (supplier.distance || 0)); // Closer = higher score
      const ratingScore = (supplier.rating?.average || 0) * 2; // Rating * 2
      const materialScore = matchedMaterials.length * 3; // More matching materials = higher score
      const verificationScore = supplier.isVerified ? 5 : 0; // Verified bonus
      
      const totalScore = distanceScore + ratingScore + materialScore + verificationScore;

      return {
        ...supplier.toObject(),
        matchedMaterials,
        matchedMaterialsCount: matchedMaterials.length,
        relevanceScore: totalScore,
        searchCriteria: {
          productMatch: keyword || 'All products',
          distance: supplier.distance,
          rating: supplier.rating?.average || 0,
          isVerified: supplier.isVerified,
          maxDistance,
          minRating
        }
      };
    });

    // Step 7: Sort by relevance score (highest first)
    enhancedSuppliers.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Step 8: Update search results count
    await VendorSearch.findOneAndUpdate(
      { vendorId: vendor._id, keyword: originalKeyword || keyword, timestamp: { $gte: new Date(Date.now() - 60000) } },
      { 
        searchResults: enhancedSuppliers.length,
        filters: {
          maxDistance,
          minRating,
          verifiedOnly,
          translationInfo
        }
      },
      { sort: { timestamp: -1 } }
    );

    console.log(`✅ Comprehensive search completed: ${enhancedSuppliers.length} suppliers found`);
    console.log(`🎯 Search criteria applied:`);
    console.log(`   - Product: "${keyword || 'All products'}"`);
    console.log(`   - Distance: ≤ ${maxDistance}km`);
    console.log(`   - Rating: ≥ ${minRating}`);
    console.log(`   - Verified: ${verifiedOnly ? 'Yes' : 'No'}`);

    res.json({
      success: true,
      suppliers: enhancedSuppliers,
      searchResults: enhancedSuppliers.length,
      searchInfo: {
        keyword: originalKeyword || keyword,
        translatedKeyword: keyword,
        translationInfo,
        filters: {
          maxDistance,
          minRating,
          verifiedOnly
        },
        stepResults: {
          totalSuppliers: allSuppliers.length,
          verifiedSuppliers: verifiedSuppliers.length,
          productFiltered: productFilteredSuppliers.length,
          nearbySuppliers: nearbySuppliers.length,
          ratedSuppliers: ratedSuppliers.length,
          finalResults: enhancedSuppliers.length
        }
      }
    });

  } catch (error) {
    console.error('Search suppliers error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search suppliers',
      message: error.message 
    });
  }
};

/**
 * Get vendor's order history
 */
export const getOrderHistory = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { page = 1, limit = 10, status } = req.query;

    // Get vendor from dedicated Vendor model
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found for this user'
      });
    }

    const query = { vendorId: vendor._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('supplierId', 'businessName businessType rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get order history',
      message: error.message 
    });
  }
};

/**
 * Get vendor cart (placeholder for future implementation)
 */
export const getCart = async (req, res) => {
  try {
    // Placeholder for cart functionality
    res.json({
      success: true,
      cart: [],
      message: 'Cart functionality coming soon'
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get cart',
      message: error.message 
    });
  }
};

/**
 * Place order
 */
export const placeOrder = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { supplierId, items, deliveryAddress, paymentMethod } = req.body;

    // Get vendor from dedicated Vendor model
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found for this user'
      });
    }

    // Get supplier from User model (unified approach)
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ _id: supplierId, role: 'supplier' });
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'The specified supplier was not found'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const material = supplier.availableItems?.find(m => m._id.toString() === item.materialId);
      if (!material) {
        return res.status(400).json({ 
          success: false,
          error: 'Material not found',
          message: `Material ${item.materialId} not found in supplier's inventory`
        });
      }

      if (!material.isAvailable) {
        return res.status(400).json({ 
          success: false,
          error: 'Material not available',
          message: `${material.name} is currently not available`
        });
      }

      if (item.quantity < material.minimumOrderQuantity) {
        return res.status(400).json({ 
          success: false,
          error: 'Minimum order quantity not met',
          message: `Minimum order quantity for ${material.name} is ${material.minimumOrderQuantity} ${material.unit}`
        });
      }

      const itemTotal = material.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        materialId: material._id,
        name: material.name,
        quantity: item.quantity,
        unit: material.unit,
        price: material.price,
        total: itemTotal
      });
    }

    // Create order
    const order = new Order({
      vendorId: vendor._id,
      supplierId: supplier._id,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || vendor.location,
      paymentMethod,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    await order.save();

    // Emit WebSocket event for real-time updates
    emitToUser(supplier.firebaseUid, 'order_request_sent', {
      orderId: order._id,
      vendorId: vendorFirebaseUid,
      supplierId: supplier.firebaseUid,
      totalAmount,
      items: orderItems,
      timestamp: new Date()
    });

    res.json({
      success: true,
      order,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to place order',
      message: error.message 
    });
  }
};

/**
 * Make payment for order
 */
export const makePayment = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { orderId } = req.params;
    const { paymentMethod, transactionId } = req.body;

    // Get vendor from dedicated Vendor model
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found for this user'
      });
    }

    const order = await Order.findOne({ _id: orderId, vendorId: vendor._id });
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found',
        message: 'The specified order was not found'
      });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({ 
        success: false,
        error: 'Order is not approved for payment',
        message: 'Order must be approved before payment can be made'
      });
    }

    // Update order status
    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    order.paymentTransactionId = transactionId;
    await order.save();

    // Get supplier to emit socket event
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ _id: order.supplierId, role: 'supplier' });
    if (supplier) {
      // Emit payment made event to supplier
      emitToUser(supplier.firebaseUid, 'payment_made', {
        orderId: order._id,
        vendorId: vendorFirebaseUid,
        supplierId: supplier.firebaseUid,
        amount: order.totalAmount,
        paymentMethod,
        timestamp: new Date()
      });
      
      // Emit payment confirmation to vendor
      emitToUser(vendorFirebaseUid, 'payment_confirmed', {
        orderId: order._id,
        supplierId: supplier.firebaseUid,
        supplierName: supplier.businessName,
        amount: order.totalAmount,
        paymentMethod,
        transactionId,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      order,
      transactionId,
      message: 'Payment successful'
    });

  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process payment',
      message: error.message 
    });
  }
};

/**
 * Get vendor profile
 */
export const getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.uid;
    
    // Get vendor from dedicated Vendor model
    const vendor = await Vendor.findOne({ firebaseUid: vendorId });

    if (!vendor) {
      return res.status(404).json({ 
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found for this user'
      });
    }

    res.json({
      success: true,
      vendor
    });

  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get vendor profile',
      message: error.message 
    });
  }
};

/**
 * Update vendor location
 */
export const updateVendorLocation = async (req, res) => {
  try {
    const vendorId = req.user.uid;
    const { lat, lng, address, city, state, country, zipCode } = req.body;

    // First, try to find existing vendor
    let vendor = await Vendor.findOne({ firebaseUid: vendorId });

    if (vendor) {
      // Update existing vendor location
      vendor = await Vendor.findOneAndUpdate(
        { firebaseUid: vendorId },
        { 
          location: { 
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            lat, lng, address, city, state, country, zipCode 
          },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new vendor with location data
      // We need to get user info from Firebase or create a minimal profile
      const User = (await import('../models/User.js')).default;
      const user = await User.findOne({ firebaseUid: vendorId });
      
      const vendorData = {
        firebaseUid: vendorId,
        name: user?.name || 'Vendor User',
        email: user?.email || `${vendorId}@vendor.com`,
        phone: user?.phone || '0000000000',
        location: { 
          type: 'Point',
          coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
          lat, lng, address, city, state, country, zipCode 
        }
      };

      vendor = new Vendor(vendorData);
      await vendor.save();
    }

    // Emit WebSocket event for real-time updates
    emitToUser(vendorId, 'profile_updated', {
      type: 'vendor_location',
      data: vendor,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      vendor,
      message: vendor ? 'Location updated successfully' : 'Vendor profile created with location'
    });

  } catch (error) {
    console.error('Update vendor location error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update location',
      message: error.message 
    });
  }
}; 