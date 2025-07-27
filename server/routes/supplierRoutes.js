import express from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import { emitToUser } from '../utils/socketManager.js';
import {
  getSupplierMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getSupplierOrders,
  approveOrder,
  rejectOrder,
  dispatchOrder,
  deliverOrder
} from '../controllers/supplierController.js';

const router = express.Router();

// Public routes (no authentication required)
// Get supplier reviews (public endpoint - no authentication required)
router.get('/:supplierId/reviews', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const Review = (await import('../models/Review.js')).default;
    const User = (await import('../models/User.js')).default;

    // Verify supplier exists
    const supplier = await User.findOne({ _id: supplierId, role: 'supplier' });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found',
        message: 'Supplier not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with pagination
    const reviews = await Review.find({ 
      supplierId: supplierId,
      isVerified: true 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-supplierFirebaseUid -isReported -reportReason');

    const totalReviews = await Review.countDocuments({ 
      supplierId: supplierId,
      isVerified: true 
    });

    // Get rating statistics
    const ratingStats = await Review.getAverageRating(supplierId);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit))
      },
      statistics: ratingStats
    });

  } catch (error) {
    console.error('Error fetching supplier reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews',
      message: error.message
    });
  }
});

// Apply authentication middleware to all other routes
router.use(verifyFirebaseToken);

// Profile routes - using User model for profile management
router.get('/profile', async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    
    // First try to get from User model (unified approach)
    const User = (await import('../models/User.js')).default;
    let supplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
    
    if (!supplier) {
      // Fallback to Supplier model if not found in User model
      const Supplier = (await import('../models/Supplier.js')).default;
      supplier = await Supplier.findOne({ firebaseUid: supplierFirebaseUid });
      
      if (!supplier) {
        return res.status(404).json({ 
          success: false,
          error: 'Supplier not found',
          message: 'No supplier profile found for this user'
        });
      }
    }
    
    res.json({ 
      success: true, 
      supplier,
      message: 'Supplier profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get supplier profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get supplier profile',
      message: error.message 
    });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const profileData = req.body;
    
    // Validate required fields for supplier
    if (!profileData.businessName || profileData.businessName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Business name is required',
        message: 'Please provide a business name'
      });
    }
    
    // Clean up the data - remove empty name if it's not provided
    const cleanProfileData = { ...profileData };
    if (!cleanProfileData.name || cleanProfileData.name.trim() === '') {
      delete cleanProfileData.name; // Remove empty name field
    }
    
    // Process location data if provided
    if (cleanProfileData.location) {
      console.log('Processing location data:', JSON.stringify(cleanProfileData.location));
      
      // If location has lat/lng, ensure coordinates are set for GeoJSON
      if (cleanProfileData.location.lat && cleanProfileData.location.lng) {
        cleanProfileData.location.coordinates = [cleanProfileData.location.lng, cleanProfileData.location.lat];
        cleanProfileData.location.type = 'Point';
        console.log('Added coordinates from lat/lng:', cleanProfileData.location.coordinates);
      }
      // If location has coordinates but no lat/lng, add them
      else if (cleanProfileData.location.coordinates && cleanProfileData.location.coordinates.length === 2 && 
               !cleanProfileData.location.lat && !cleanProfileData.location.lng) {
        cleanProfileData.location.lng = cleanProfileData.location.coordinates[0];
        cleanProfileData.location.lat = cleanProfileData.location.coordinates[1];
        cleanProfileData.location.type = 'Point';
        console.log('Added lat/lng from coordinates:', cleanProfileData.location.lat, cleanProfileData.location.lng);
      }
      // If location is incomplete (missing lat/lng or coordinates), remove it to avoid geospatial errors
      else if (!cleanProfileData.location.lat || !cleanProfileData.location.lng || 
               !cleanProfileData.location.coordinates || cleanProfileData.location.coordinates.length === 0) {
        console.log('Removing incomplete location data to avoid geospatial errors');
        delete cleanProfileData.location;
      }
    }
    
    // Ensure role is set to supplier
    cleanProfileData.role = 'supplier';
    
    console.log('Creating/updating supplier profile with data:', cleanProfileData);
    
    // Try to create/update in User model first
    const User = (await import('../models/User.js')).default;
    let supplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
    
    if (supplier) {
      // Update existing supplier in User model
      supplier = await User.findOneAndUpdate(
        { firebaseUid: supplierFirebaseUid, role: 'supplier' },
        { 
          ...cleanProfileData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new supplier in User model
      supplier = new User({
        firebaseUid: supplierFirebaseUid,
        role: 'supplier',
        ...cleanProfileData
      });
      await supplier.save();
    }
    
    // Emit WebSocket event for real-time updates
    emitToUser(supplierFirebaseUid, 'profile_updated', {
      type: 'supplier_profile',
      data: supplier,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      supplier,
      message: supplier ? 'Supplier profile updated successfully' : 'Supplier profile created successfully'
    });
  } catch (error) {
    console.error('Create/Update supplier profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create/update supplier profile',
      message: error.message 
    });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const updateData = req.body;
    
    // Validate required fields for supplier
    if (updateData.businessName !== undefined && (!updateData.businessName || updateData.businessName.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Business name is required',
        message: 'Please provide a business name'
      });
    }
    
    // Clean up the data - remove empty name if it's not provided
    const cleanUpdateData = { ...updateData };
    if (cleanUpdateData.name !== undefined && (!cleanUpdateData.name || cleanUpdateData.name.trim() === '')) {
      delete cleanUpdateData.name; // Remove empty name field
    }
    
    // Process location data if provided
    if (cleanUpdateData.location) {
      console.log('Processing location data in PATCH:', JSON.stringify(cleanUpdateData.location));
      
      // If location has lat/lng, ensure coordinates are set for GeoJSON
      if (cleanUpdateData.location.lat && cleanUpdateData.location.lng) {
        cleanUpdateData.location.coordinates = [cleanUpdateData.location.lng, cleanUpdateData.location.lat];
        cleanUpdateData.location.type = 'Point';
        console.log('Added coordinates from lat/lng:', cleanUpdateData.location.coordinates);
      }
      // If location has coordinates but no lat/lng, add them
      else if (cleanUpdateData.location.coordinates && cleanUpdateData.location.coordinates.length === 2 && 
               !cleanUpdateData.location.lat && !cleanUpdateData.location.lng) {
        cleanUpdateData.location.lng = cleanUpdateData.location.coordinates[0];
        cleanUpdateData.location.lat = cleanUpdateData.location.coordinates[1];
        cleanUpdateData.location.type = 'Point';
        console.log('Added lat/lng from coordinates:', cleanUpdateData.location.lat, cleanUpdateData.location.lng);
      }
      // If location is incomplete (missing lat/lng or coordinates), remove it to avoid geospatial errors
      else if (!cleanUpdateData.location.lat || !cleanUpdateData.location.lng || 
               !cleanUpdateData.location.coordinates || cleanUpdateData.location.coordinates.length === 0) {
        console.log('Removing incomplete location data to avoid geospatial errors');
        delete cleanUpdateData.location;
      }
    }
    
    console.log('Updating supplier profile with data:', cleanUpdateData);
    
    // Update supplier in User model
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOneAndUpdate(
      { firebaseUid: supplierFirebaseUid, role: 'supplier' },
      { 
        ...cleanUpdateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'No supplier profile found to update'
      });
    }
    
    // Emit WebSocket event for real-time updates
    emitToUser(supplierFirebaseUid, 'profile_updated', {
      type: 'supplier_profile',
      data: supplier,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      supplier,
      message: 'Supplier profile updated successfully'
    });
  } catch (error) {
    console.error('Update supplier profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update supplier profile',
      message: error.message 
    });
  }
});

// Material routes - using SupplierMaterial model
router.get('/materials', getSupplierMaterials);
router.post('/materials', addMaterial);
router.put('/materials/:materialId', updateMaterial);
router.delete('/materials/:materialId', deleteMaterial);

// Get materials for a specific supplier (for vendors)
router.get('/:supplierId/materials', async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Get supplier from User model
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ _id: supplierId, role: 'supplier' });
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'Supplier not found or inactive'
      });
    }

    // Get materials from availableItems array
    const materials = supplier.availableItems || [];

    res.json({
      success: true,
      materials: materials,
      supplier: {
        _id: supplier._id,
        businessName: supplier.businessName,
        businessType: supplier.businessType,
        location: supplier.location
      }
    });

  } catch (error) {
    console.error('Get supplier materials error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get materials',
      message: error.message 
    });
  }
});

// Order routes
router.get('/orders', getSupplierOrders);
router.patch('/orders/:orderId/approve', approveOrder);
router.patch('/orders/:orderId/reject', rejectOrder);
router.patch('/orders/:orderId/dispatch', dispatchOrder);
router.patch('/orders/:orderId/deliver', deliverOrder);

// Location management
router.patch('/location', async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { lat, lng, address, city, state, country, zipCode } = req.body;

    // Update supplier location in User model
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOneAndUpdate(
      { firebaseUid: supplierFirebaseUid, role: 'supplier' },
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

    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'No supplier profile found for this user'
      });
    }

    // Emit WebSocket event for real-time updates
    emitToUser(supplierFirebaseUid, 'profile_updated', {
      type: 'supplier_location',
      data: supplier,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      supplier,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update supplier location error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update location',
      message: error.message 
    });
  }
});

// Get nearby suppliers within 10km of vendor location
router.get('/nearby', async (req, res) => {
  try {
    const { vendorId } = req.query;
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required',
        message: 'Please provide vendorId query parameter'
      });
    }

    // Get vendor location
    const Vendor = (await import('../models/Vendor.js')).default;
    const vendor = await Vendor.findOne({ firebaseUid: vendorId });
    
    if (!vendor || !vendor.location || !vendor.location.coordinates) {
      return res.status(404).json({
        success: false,
        error: 'Vendor location not found',
        message: 'Vendor location is required to find nearby suppliers'
      });
    }

    const vendorLocation = vendor.location.coordinates; // [longitude, latitude]
    const maxDistance = 10000; // 10km in meters

    console.log(`Finding suppliers within ${maxDistance}m of vendor at [${vendorLocation[0]}, ${vendorLocation[1]}]`);

    // Find suppliers within 10km using MongoDB geospatial query
    const User = (await import('../models/User.js')).default;
    const nearbySuppliers = await User.find({
      role: 'supplier',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: vendorLocation
          },
          $maxDistance: maxDistance
        }
      }
    }).select({
      firebaseUid: 1,
      businessName: 1,
      businessType: 1,
      category: 1,
      productCategories: 1,
      location: 1,
      rating: 1,
      isVerified: 1,
      availableItems: 1,
      phone: 1,
      email: 1
    }).limit(50); // Limit to 50 nearby suppliers

    console.log(`Found ${nearbySuppliers.length} suppliers within ${maxDistance}m`);

    // Calculate distance for each supplier
    const suppliersWithDistance = nearbySuppliers.map(supplier => {
      const supplierLocation = supplier.location.coordinates;
      const distance = calculateDistance(
        vendorLocation[1], vendorLocation[0], // vendor lat, lng
        supplierLocation[1], supplierLocation[0] // supplier lat, lng
      );
      
      return {
        ...supplier.toObject(),
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    // Sort by distance (closest first)
    suppliersWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      suppliers: suppliersWithDistance,
      count: suppliersWithDistance.length,
      vendorLocation: {
        coordinates: vendorLocation,
        address: vendor.location.address,
        city: vendor.location.city,
        state: vendor.location.state,
        country: vendor.location.country
      },
      searchRadius: maxDistance / 1000 // in km
    });

  } catch (error) {
    console.error('Error finding nearby suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearby suppliers',
      message: error.message
    });
  }
});

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export default router; 