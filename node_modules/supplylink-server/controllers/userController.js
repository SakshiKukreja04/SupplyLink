import { firestore } from '../config/firebaseAdmin.js';

/**
 * Get user profile from Firestore
 * GET /api/user/profile
 */
export const getProfile = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get user data from Firestore
    const userDoc = await firestore.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        error: 'PROFILE_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    // Combine Firebase Auth data with Firestore data
    const profile = {
      uid: uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      name: userData.name || req.user.name,
      role: userData.role || 'user',
      phone: userData.phone,
      location: userData.location,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      // Add any additional fields from Firestore
      ...userData
    };

    console.log(`📋 Retrieved profile for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    });

  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Update user location
 * POST /api/user/location
 */
export const updateLocation = async (req, res) => {
  try {
    const { uid } = req.user;
    const { latitude, longitude, address, timestamp } = req.body;

    // Validate required fields
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
        error: 'MISSING_COORDINATES'
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90',
        error: 'INVALID_LATITUDE'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180',
        error: 'INVALID_LONGITUDE'
      });
    }

    // Prepare location data
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || null,
      timestamp: timestamp || new Date(),
      updatedAt: new Date()
    };

    // Update user document in Firestore
    await firestore.collection('users').doc(uid).update({
      location: locationData,
      updatedAt: new Date()
    });

    console.log(`📍 Updated location for user: ${req.user.email} - ${latitude}, ${longitude}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: locationData,
        message: 'Location data has been stored in the database'
      }
    });

  } catch (error) {
    console.error('❌ Error updating user location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get user location
 * GET /api/user/location
 */
export const getLocation = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get user data from Firestore
    const userDoc = await firestore.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        error: 'PROFILE_NOT_FOUND'
      });
    }

    const userData = userDoc.data();
    const location = userData.location;

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location data not found',
        error: 'LOCATION_NOT_FOUND'
      });
    }

    console.log(`📍 Retrieved location for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Location retrieved successfully',
      data: location
    });

  } catch (error) {
    console.error('❌ Error getting user location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, phone, role } = req.body;

    // Validate input
    const updateData = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long',
          error: 'INVALID_NAME'
        });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          error: 'INVALID_PHONE'
        });
      }
      updateData.phone = phone;
    }

    if (role !== undefined) {
      const validRoles = ['supplier', 'vendor', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be one of: supplier, vendor, user',
          error: 'INVALID_ROLE'
        });
      }
      updateData.role = role;
    }

    // Add timestamp
    updateData.updatedAt = new Date();

    // Update user document in Firestore
    await firestore.collection('users').doc(uid).update(updateData);

    console.log(`📝 Updated profile for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Delete user account (soft delete)
 * DELETE /api/user/profile
 */
export const deleteProfile = async (req, res) => {
  try {
    const { uid } = req.user;

    // Soft delete by marking user as deleted
    await firestore.collection('users').doc(uid).update({
      deleted: true,
      deletedAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`🗑️ Soft deleted profile for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
      data: {
        message: 'Your account has been marked as deleted'
      }
    });

  } catch (error) {
    console.error('❌ Error deleting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
}; 