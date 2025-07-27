import express from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  searchSuppliers,
  getOrderHistory,
  getCart,
  placeOrder,
  makePayment,
  getVendorProfile,
  updateVendorLocation
} from '../controllers/vendorController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyFirebaseToken);

// Profile routes - using dedicated Vendor model
router.get('/profile', getVendorProfile);
router.post('/profile', async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const profileData = req.body;
    
    // Validate required fields for vendor
    if (!profileData.name || profileData.name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
        message: 'Please provide your name'
      });
    }
    
    if (!profileData.email || profileData.email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        message: 'Please provide your email'
      });
    }
    
    if (!profileData.phone || profileData.phone.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Phone is required',
        message: 'Please provide your phone number'
      });
    }
    
    if (!profileData.location || !profileData.location.lat || !profileData.location.lng) {
      return res.status(400).json({
        success: false,
        error: 'Location is required',
        message: 'Please provide your location coordinates'
      });
    }
    
    console.log('Creating/updating vendor profile with data:', profileData);
    
    // Use dedicated Vendor model
    const Vendor = (await import('../models/Vendor.js')).default;
    let vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    
    if (vendor) {
      // Update existing vendor
      vendor = await Vendor.findOneAndUpdate(
        { firebaseUid: vendorFirebaseUid },
        { 
          ...profileData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new vendor
      vendor = new Vendor({
        firebaseUid: vendorFirebaseUid,
        ...profileData
      });
      await vendor.save();
    }
    
    // Emit WebSocket event for real-time updates
    const { emitToUser } = await import('../utils/socketManager.js');
    emitToUser(vendorFirebaseUid, 'profile_updated', {
      type: 'vendor_profile',
      data: vendor,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      vendor,
      message: vendor ? 'Vendor profile updated successfully' : 'Vendor profile created successfully'
    });
  } catch (error) {
    console.error('Create/Update vendor profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create/update vendor profile',
      message: error.message 
    });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const updateData = req.body;
    
    // Validate required fields for vendor
    if (updateData.name !== undefined && (!updateData.name || updateData.name.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
        message: 'Please provide your name'
      });
    }
    
    if (updateData.email !== undefined && (!updateData.email || updateData.email.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        message: 'Please provide your email'
      });
    }
    
    if (updateData.phone !== undefined && (!updateData.phone || updateData.phone.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Phone is required',
        message: 'Please provide your phone number'
      });
    }
    
    console.log('Updating vendor profile with data:', updateData);
    
    // Update vendor in dedicated Vendor model
    const Vendor = (await import('../models/Vendor.js')).default;
    const vendor = await Vendor.findOneAndUpdate(
      { firebaseUid: vendorFirebaseUid },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found to update'
      });
    }
    
    // Emit WebSocket event for real-time updates
    const { emitToUser } = await import('../utils/socketManager.js');
    emitToUser(vendorFirebaseUid, 'profile_updated', {
      type: 'vendor_profile',
      data: vendor,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      vendor,
      message: 'Vendor profile updated successfully'
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update vendor profile',
      message: error.message 
    });
  }
});

// Search and discovery
router.post('/search', searchSuppliers);

// Order management
router.get('/orders', getOrderHistory);
router.post('/orders', placeOrder);
router.post('/orders/:orderId/payment', makePayment);

// Cart management (placeholder for future implementation)
router.get('/cart', getCart);

// Location management
router.patch('/location', updateVendorLocation);

// PUT route for vendor updates (as requested)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If location is provided, ensure it has GeoJSON format
    if (updateData.location && updateData.location.lat && updateData.location.lng) {
      updateData.location = {
        type: 'Point',
        coordinates: [updateData.location.lng, updateData.location.lat], // [longitude, latitude]
        ...updateData.location
      };
    }
    
    const Vendor = (await import('../models/Vendor.js')).default;
    const updated = await Vendor.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        error: "Vendor not found",
        message: "No vendor found with the specified ID"
      });
    }
    
    // Emit WebSocket event for real-time updates
    const { emitToUser } = await import('../utils/socketManager.js');
    emitToUser(updated.firebaseUid, 'profile_updated', {
      type: 'vendor_profile',
      data: updated,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      vendor: updated,
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    console.error('PUT vendor update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update vendor',
      message: error.message 
    });
  }
});

export default router; 