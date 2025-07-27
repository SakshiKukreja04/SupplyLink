import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  deleteProfile,
  updateLocation, 
  getLocation 
} from '../controllers/userController.js';
import { 
  verifyFirebaseToken, 
  verifyRole, 
  requireEmailVerification 
} from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

// Public routes for user profile creation (no authentication required)
/**
 * @route   GET /api/user/profile/:uid
 * @desc    Get user profile by Firebase UID
 * @access  Public (for initial user creation)
 */
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Try to get vendor first
    const Vendor = (await import('../models/Vendor.js')).default;
    let user = await Vendor.findOne({ firebaseUid: uid });
    
    if (user) {
      return res.json({
        success: true,
        user: {
          id: user.firebaseUid,
          email: user.email,
          role: 'vendor',
          name: user.name,
          phone: user.phone,
          location: user.location ? {
            latitude: user.location.lat,
            longitude: user.location.lng
          } : undefined
        }
      });
    }
    
    // Try to get supplier
    const User = (await import('../models/User.js')).default;
    user = await User.findOne({ firebaseUid: uid, role: 'supplier' });
    
    if (user) {
      return res.json({
        success: true,
        user: {
          id: user.firebaseUid,
          email: user.email,
          role: 'supplier',
          name: user.name,
          phone: user.phone,
          location: user.location ? {
            latitude: user.location.lat,
            longitude: user.location.lng
          } : undefined
        }
      });
    }
    
    // User not found
    res.status(404).json({
      success: false,
      error: 'User not found',
      message: 'No user profile found for this Firebase UID'
    });
    
  } catch (error) {
    console.error('Get user profile by UID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/user/profile/:uid
 * @desc    Create or update user profile by Firebase UID
 * @access  Public (for initial user creation)
 */
router.put('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userData = req.body;
    
    console.log('Creating/updating user profile for UID:', uid, 'with data:', JSON.stringify(userData, null, 2));
    
    if (userData.role === 'vendor') {
      // Handle vendor creation/update
      const Vendor = (await import('../models/Vendor.js')).default;
      let vendor = await Vendor.findOne({ firebaseUid: uid });
      
      if (vendor) {
        // Update existing vendor
        console.log('Updating existing vendor with data:', userData);
        
        if (userData.name) {
          vendor.name = userData.name.trim();
        }
        if (userData.email) {
          vendor.email = userData.email.trim().toLowerCase();
        }
        if (userData.phone) {
          vendor.phone = userData.phone.trim();
        }
        
        if (userData.location) {
          vendor.location = {
            type: 'Point',
            coordinates: [userData.location.longitude, userData.location.latitude],
            lat: userData.location.latitude,
            lng: userData.location.longitude
          };
        }
        
        await vendor.save();
        console.log('Vendor updated successfully:', vendor._id);
      } else {
        // Create new vendor
        console.log('Creating new vendor with data:', userData);
        
        // Validate required fields
        if (!userData.name || !userData.email || !userData.phone) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'Name, email, and phone are required for vendor registration'
          });
        }
        
        const vendorData = {
          firebaseUid: uid,
          name: userData.name.trim(),
          email: userData.email.trim().toLowerCase(),
          phone: userData.phone.trim(),
          location: userData.location ? {
            type: 'Point',
            coordinates: [userData.location.longitude, userData.location.latitude],
            lat: userData.location.latitude,
            lng: userData.location.longitude
          } : {
            type: 'Point',
            coordinates: [0, 0],
            lat: 0,
            lng: 0
          }
        };
        
        console.log('Vendor data to save:', vendorData);
        vendor = new Vendor(vendorData);
        await vendor.save();
        console.log('Vendor created successfully:', vendor._id);
      }
      
      res.json({
        success: true,
        user: {
          id: vendor.firebaseUid,
          email: vendor.email,
          role: 'vendor',
          name: vendor.name,
          phone: vendor.phone,
          location: vendor.location ? {
            latitude: vendor.location.lat,
            longitude: vendor.location.lng
          } : undefined
        }
      });
      
    } else if (userData.role === 'supplier') {
      // Handle supplier creation/update
      const User = (await import('../models/User.js')).default;
      let supplier = await User.findOne({ firebaseUid: uid, role: 'supplier' });
      
      if (supplier) {
        // Update existing supplier
        supplier.name = userData.name || supplier.name;
        supplier.email = userData.email || supplier.email;
        supplier.phone = userData.phone || supplier.phone;
        supplier.businessName = userData.businessName || supplier.businessName;
        supplier.businessType = userData.businessType || supplier.businessType;
        supplier.category = userData.category || supplier.category;
        supplier.productCategories = userData.productCategories || supplier.productCategories;
        
        if (userData.location) {
          supplier.location = {
            type: 'Point',
            coordinates: [userData.location.longitude, userData.location.latitude],
            lat: userData.location.latitude,
            lng: userData.location.longitude
          };
        }
        
        await supplier.save();
      } else {
        // Create new supplier
        const supplierData = {
          firebaseUid: uid,
          role: 'supplier',
          name: userData.name || 'Supplier',
          email: userData.email,
          phone: userData.phone || '',
          businessName: userData.businessName || 'Test Supplier',
          businessType: userData.businessType || 'Manufacturing',
          category: userData.category || 'Raw Materials',
          productCategories: userData.productCategories || ['General'],
          location: userData.location ? {
            type: 'Point',
            coordinates: [userData.location.longitude, userData.location.latitude],
            lat: userData.location.latitude,
            lng: userData.location.longitude
          } : {
            type: 'Point',
            coordinates: [0, 0],
            lat: 0,
            lng: 0
          }
        };
        
        supplier = new User(supplierData);
        await supplier.save();
      }
      
      res.json({
        success: true,
        user: {
          id: supplier.firebaseUid,
          email: supplier.email,
          role: 'supplier',
          name: supplier.name,
          phone: supplier.phone,
          businessName: supplier.businessName,
          businessType: supplier.businessType,
          category: supplier.category,
          productCategories: supplier.productCategories,
          location: supplier.location ? {
            latitude: supplier.location.lat,
            longitude: supplier.location.lng
          } : undefined
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: 'Role must be either "vendor" or "supplier"'
      });
    }
    
  } catch (error) {
    console.error('Create/update user profile by UID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create/update user profile',
      message: error.message
    });
  }
});

// Apply Firebase token verification to all routes below this point
router.use(verifyFirebaseToken);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile from Firestore
 * @access  Private (requires Firebase token)
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private (requires Firebase token)
 */
router.put('/profile', updateProfile);



/**
 * @route   DELETE /api/user/profile
 * @desc    Soft delete user account
 * @access  Private (requires Firebase token)
 */
router.delete('/profile', deleteProfile);

/**
 * @route   GET /api/user/location
 * @desc    Get user location from Firestore
 * @access  Private (requires Firebase token)
 */
router.get('/location', getLocation);

/**
 * @route   POST /api/user/location
 * @desc    Update user location
 * @access  Private (requires Firebase token)
 */
router.post('/location', updateLocation);

/**
 * @route   GET /api/user/health
 * @desc    Health check endpoint (for testing authentication)
 * @access  Private (requires Firebase token)
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    data: {
      user: {
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        role: req.user.role,
        provider: req.user.provider
      },
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route   GET /api/user/admin
 * @desc    Admin-only endpoint (example of role-based access)
 * @access  Private (requires Firebase token + admin role)
 */
router.get('/admin', 
  verifyRole(['admin']), 
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin access granted',
      data: {
        user: req.user,
        adminFeatures: ['user_management', 'analytics', 'settings'],
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route   GET /api/user/supplier
 * @desc    Supplier-only endpoint
 * @access  Private (requires Firebase token + supplier role)
 */
router.get('/supplier', 
  verifyRole(['supplier']), 
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Supplier access granted',
      data: {
        user: req.user,
        supplierFeatures: ['inventory_management', 'order_processing', 'analytics'],
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route   GET /api/user/vendor
 * @desc    Vendor-only endpoint
 * @access  Private (requires Firebase token + vendor role)
 */
router.get('/vendor', 
  verifyRole(['vendor']), 
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Vendor access granted',
      data: {
        user: req.user,
        vendorFeatures: ['order_placement', 'supplier_search', 'tracking'],
        timestamp: new Date().toISOString()
      }
    });
  }
);

export default router; 