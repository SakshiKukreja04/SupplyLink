import Vendor from '../models/Vendor.js';
import Supplier from '../models/Supplier.js';

/**
 * User Service
 * Handles user creation and management in MongoDB after Firebase authentication
 */
class UserService {
  
  /**
   * Create or update user in MongoDB based on role
   */
  static async createOrUpdateUser(firebaseUser, userData) {
    try {
      const { role, name, phone, location } = userData;
      
      if (role === 'vendor') {
        return await this.createOrUpdateVendor(firebaseUser, userData);
      } else if (role === 'supplier') {
        return await this.createOrUpdateSupplier(firebaseUser, userData);
      } else {
        throw new Error('Invalid user role');
      }
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * Create or update vendor in MongoDB
   */
  static async createOrUpdateVendor(firebaseUser, userData) {
    try {
      const { name, phone, location } = userData;
      
      // Check if vendor already exists
      let vendor = await Vendor.findOne({ firebaseUid: firebaseUser.uid });
      
      if (vendor) {
        // Update existing vendor
        vendor.name = name || vendor.name;
        vendor.phone = phone || vendor.phone;
        vendor.email = firebaseUser.email || vendor.email;
        vendor.lastLogin = new Date();
        
        // Update location if provided
        if (location && location.latitude && location.longitude) {
          vendor.location.lat = location.latitude;
          vendor.location.lng = location.longitude;
        }
        
        await vendor.save();
        console.log('✅ Updated existing vendor:', vendor._id);
      } else {
        // Create new vendor
        const vendorData = {
          firebaseUid: firebaseUser.uid,
          name: name || firebaseUser.displayName || 'Vendor',
          email: firebaseUser.email,
          phone: phone || '',
          location: {
            lat: location?.latitude || 0,
            lng: location?.longitude || 0
          }
        };
        
        vendor = new Vendor(vendorData);
        await vendor.save();
        console.log('✅ Created new vendor:', vendor._id);
      }
      
      return vendor;
    } catch (error) {
      console.error('❌ Error creating/updating vendor:', error);
      throw error;
    }
  }

  /**
   * Create or update supplier in MongoDB
   */
  static async createOrUpdateSupplier(firebaseUser, userData) {
    try {
      const { name, phone, location } = userData;
      
      // Check if supplier already exists
      let supplier = await Supplier.findOne({ firebaseUid: firebaseUser.uid });
      
      if (supplier) {
        // Update existing supplier
        supplier.name = name || supplier.name;
        supplier.phone = phone || supplier.phone;
        supplier.email = firebaseUser.email || supplier.email;
        supplier.lastLogin = new Date();
        
        // Update location if provided
        if (location && location.latitude && location.longitude) {
          supplier.location.lat = location.latitude;
          supplier.location.lng = location.longitude;
        }
        
        await supplier.save();
        console.log('✅ Updated existing supplier:', supplier._id);
      } else {
        // Create new supplier
        const supplierData = {
          firebaseUid: firebaseUser.uid,
          name: name || firebaseUser.displayName || 'Supplier',
          email: firebaseUser.email,
          phone: phone || '',
          location: {
            lat: location?.latitude || 0,
            lng: location?.longitude || 0
          }
        };
        
        supplier = new Supplier(supplierData);
        await supplier.save();
        console.log('✅ Created new supplier:', supplier._id);
      }
      
      return supplier;
    } catch (error) {
      console.error('❌ Error creating/updating supplier:', error);
      throw error;
    }
  }

  /**
   * Get user profile by Firebase UID and role
   */
  static async getUserProfile(firebaseUid, role) {
    try {
      if (role === 'vendor') {
        return await Vendor.findOne({ firebaseUid });
      } else if (role === 'supplier') {
        return await Supplier.findOne({ firebaseUid });
      } else {
        throw new Error('Invalid user role');
      }
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user location
   */
  static async updateUserLocation(firebaseUid, role, lat, lng, address = null) {
    try {
      if (role === 'vendor') {
        const vendor = await Vendor.findOne({ firebaseUid });
        if (!vendor) throw new Error('Vendor not found');
        return await vendor.updateLocation(lat, lng, address);
      } else if (role === 'supplier') {
        const supplier = await Supplier.findOne({ firebaseUid });
        if (!supplier) throw new Error('Supplier not found');
        return await supplier.updateLocation(lat, lng, address);
      } else {
        throw new Error('Invalid user role');
      }
    } catch (error) {
      console.error('❌ Error updating user location:', error);
      throw error;
    }
  }
}

export default UserService; 