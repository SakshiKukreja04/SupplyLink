import Supplier from '../models/Supplier.js';
import SupplierMaterial from '../models/SupplierMaterial.js';
import Order from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import { emitToUser } from '../utils/socketManager.js';
import mongoose from 'mongoose';

/**
 * Get supplier profile
 */
export const getSupplierProfile = async (req, res) => {
  try {
    const supplierId = req.user.uid;
    
    // First try User model
    const User = (await import('../models/User.js')).default;
    let supplier = await User.findOne({ firebaseUid: supplierId, role: 'supplier' });
    
    if (!supplier) {
      // Fallback to Supplier model
      supplier = await Supplier.findOne({ firebaseUid: supplierId });
    }

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier
    });

  } catch (error) {
    console.error('Get supplier profile error:', error);
    res.status(500).json({ error: 'Failed to get supplier profile' });
  }
};

/**
 * Update supplier profile
 */
export const updateSupplierProfile = async (req, res) => {
  try {
    const supplierId = req.user.uid;
    const updateData = req.body;

    // Try User model first
    const User = (await import('../models/User.js')).default;
    let supplier = await User.findOneAndUpdate(
      { firebaseUid: supplierId, role: 'supplier' },
      updateData,
      { new: true }
    );

    if (!supplier) {
      // Fallback to Supplier model
      supplier = await Supplier.findOneAndUpdate(
        { firebaseUid: supplierId },
        updateData,
        { new: true }
      );
    }

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update supplier profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Update supplier location
 */
export const updateSupplierLocation = async (req, res) => {
  try {
    const supplierId = req.user.uid;
    const { lat, lng } = req.body;

    // Try User model first
    const User = (await import('../models/User.js')).default;
    let supplier = await User.findOneAndUpdate(
      { firebaseUid: supplierId, role: 'supplier' },
      { location: { lat, lng } },
      { new: true }
    );

    if (!supplier) {
      // Fallback to Supplier model
      supplier = await Supplier.findOneAndUpdate(
        { firebaseUid: supplierId },
        { location: { lat, lng } },
        { new: true }
      );
    }

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update supplier location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

/**
 * Get supplier's materials - UNIFIED APPROACH
 */
export const getSupplierMaterials = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { page = 1, limit = 10, category, isAvailable } = req.query;

    // Get supplier from User model (unified approach)
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'No supplier profile found for this user'
      });
    }

    // Get materials from availableItems array
    let materials = supplier.availableItems || [];

    // Apply filters
    if (category) {
      materials = materials.filter(item => item.category === category);
    }
    if (isAvailable !== undefined) {
      const available = isAvailable === 'true';
      materials = materials.filter(item => item.isAvailable === available);
    }

    // Apply pagination
    const total = materials.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMaterials = materials.slice(startIndex, endIndex);

    res.json({
      success: true,
      materials: paginatedMaterials,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get supplier materials error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get materials',
      message: error.message 
    });
  }
};

/**
 * Add new material - UNIFIED APPROACH
 */
export const addMaterial = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const materialData = req.body;
    
    // Validate required fields
    if (!materialData.name || materialData.name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Material name is required',
        message: 'Please provide a material name'
      });
    }
    
    if (!materialData.price || materialData.price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid price is required',
        message: 'Please provide a valid price greater than 0'
      });
    }
    
    if (!materialData.quantity || materialData.quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required',
        message: 'Please provide a valid quantity'
      });
    }
    
    if (!materialData.category || materialData.category.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Category is required',
        message: 'Please provide a category'
      });
    }

    // Get supplier from User model
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'No supplier profile found for this user'
      });
    }

    // Create new material with unique ID
    const newMaterial = {
      _id: new mongoose.Types.ObjectId(),
      name: materialData.name.trim(),
      description: materialData.description?.trim() || '',
      price: parseFloat(materialData.price),
      quantity: parseInt(materialData.quantity),
      unit: materialData.unit || 'kg',
      category: materialData.category.trim(),
      isAvailable: materialData.isAvailable !== false, // Default to true
      minimumOrderQuantity: parseInt(materialData.minimumOrderQuantity) || 1,
      deliveryTime: parseInt(materialData.deliveryTime) || 1
    };

    // Add material to availableItems array
    const updatedSupplier = await User.findOneAndUpdate(
      { firebaseUid: supplierFirebaseUid, role: 'supplier' },
      { 
        $push: { availableItems: newMaterial },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add material',
        message: 'Could not update supplier profile'
      });
    }

    // Emit WebSocket event for real-time updates
    emitToUser(supplierFirebaseUid, 'material_added', {
      supplierId: supplierFirebaseUid,
      material: newMaterial
    });

    res.json({
      success: true,
      material: newMaterial,
      message: 'Material added successfully'
    });

  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add material',
      message: error.message 
    });
  }
};

/**
 * Update material - UNIFIED APPROACH
 */
export const updateMaterial = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { materialId } = req.params;
    const updateData = req.body;

    // Validate material ID
    if (!materialId || !mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID',
        message: 'Please provide a valid material ID'
      });
    }

    // Get supplier from User model
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'No supplier profile found for this user'
      });
    }

    // Find and update the specific material in availableItems array
    const materialIndex = supplier.availableItems?.findIndex(
      item => item._id.toString() === materialId
    );

    if (materialIndex === -1 || materialIndex === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
        message: 'The specified material was not found'
      });
    }

    // Prepare update data
    const updatedMaterial = {
      ...supplier.availableItems[materialIndex],
      ...updateData,
      _id: new mongoose.Types.ObjectId(materialId), // Preserve original ID
      name: updateData.name?.trim() || supplier.availableItems[materialIndex].name,
      description: updateData.description?.trim() || supplier.availableItems[materialIndex].description,
      price: updateData.price !== undefined ? parseFloat(updateData.price) : supplier.availableItems[materialIndex].price,
      quantity: updateData.quantity !== undefined ? parseInt(updateData.quantity) : supplier.availableItems[materialIndex].quantity,
      unit: updateData.unit || supplier.availableItems[materialIndex].unit,
      category: updateData.category?.trim() || supplier.availableItems[materialIndex].category,
      isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : supplier.availableItems[materialIndex].isAvailable,
      minimumOrderQuantity: updateData.minimumOrderQuantity !== undefined ? parseInt(updateData.minimumOrderQuantity) : supplier.availableItems[materialIndex].minimumOrderQuantity,
      deliveryTime: updateData.deliveryTime !== undefined ? parseInt(updateData.deliveryTime) : supplier.availableItems[materialIndex].deliveryTime
    };

    // Update the material in the array
    const updatedSupplier = await User.findOneAndUpdate(
      { 
        firebaseUid: supplierFirebaseUid, 
        role: 'supplier',
        'availableItems._id': materialId
      },
      { 
        $set: { 
          [`availableItems.${materialIndex}`]: updatedMaterial,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update material',
        message: 'Could not update supplier profile'
      });
    }

    // Emit WebSocket event for real-time updates
    emitToUser(supplierFirebaseUid, 'material_updated', {
      supplierId: supplierFirebaseUid,
      material: updatedMaterial
    });

    res.json({
      success: true,
      material: updatedMaterial,
      message: 'Material updated successfully'
    });

  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update material',
      message: error.message 
    });
  }
};

/**
 * Delete material - UNIFIED APPROACH
 */
export const deleteMaterial = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { materialId } = req.params;

    // Validate material ID
    if (!materialId || !mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID',
        message: 'Please provide a valid material ID'
      });
    }

    // Get supplier from User model
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found',
        message: 'No supplier profile found for this user'
      });
    }

    // Check if material exists
    const materialExists = supplier.availableItems?.some(
      item => item._id.toString() === materialId
    );

    if (!materialExists) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
        message: 'The specified material was not found'
      });
    }

    // Remove material from availableItems array
    const updatedSupplier = await User.findOneAndUpdate(
      { firebaseUid: supplierFirebaseUid, role: 'supplier' },
      { 
        $pull: { availableItems: { _id: materialId } },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete material',
        message: 'Could not update supplier profile'
      });
    }

    // Emit WebSocket event for real-time updates
    emitToUser(supplierFirebaseUid, 'material_deleted', {
      supplierId: supplierFirebaseUid,
      materialId: materialId
    });

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete material',
      message: error.message 
    });
  }
};

/**
 * Get supplier's orders
 */
export const getSupplierOrders = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { page = 1, limit = 10, status } = req.query;

    // Get supplier MongoDB ID
    let supplier = await Supplier.findOne({ firebaseUid: supplierFirebaseUid });
    
    if (!supplier) {
      // Try User model
      const User = (await import('../models/User.js')).default;
      const userSupplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
      if (userSupplier) {
        // Create Supplier record if it doesn't exist
        supplier = new Supplier({
          firebaseUid: supplierFirebaseUid,
          name: userSupplier.name,
          email: userSupplier.email,
          phone: userSupplier.phone,
          businessName: userSupplier.businessName,
          businessType: userSupplier.businessType,
          productCategories: userSupplier.productCategories,
          location: userSupplier.location
        });
        await supplier.save();
      }
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const query = { supplierId: supplier._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('vendorId', 'name email phone')
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
    console.error('Get supplier orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

/**
 * Approve order
 */
export const approveOrder = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { orderId } = req.params;
    const { estimatedDeliveryDate, supplierNotes } = req.body;

    // Get supplier MongoDB ID
    let supplier = await Supplier.findOne({ firebaseUid: supplierFirebaseUid });
    
    if (!supplier) {
      // Try User model
      const User = (await import('../models/User.js')).default;
      const userSupplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
      if (userSupplier) {
        // Create Supplier record if it doesn't exist
        supplier = new Supplier({
          firebaseUid: supplierFirebaseUid,
          name: userSupplier.name,
          email: userSupplier.email,
          phone: userSupplier.phone,
          businessName: userSupplier.businessName,
          businessType: userSupplier.businessType,
          productCategories: userSupplier.productCategories,
          location: userSupplier.location
        });
        await supplier.save();
      }
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const order = await Order.findOne({ _id: orderId, supplierId: supplier._id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Pending Approval') {
      return res.status(400).json({ error: 'Order cannot be approved' });
    }

    order.status = 'Approved';
    order.estimatedDeliveryDate = estimatedDeliveryDate;
    order.supplierNotes = supplierNotes;
    await order.save();

    // Get vendor to emit socket event
    const vendor = await Vendor.findById(order.vendorId);
    if (vendor) {
      emitToUser(vendor.firebaseUid, 'order_approved', {
        orderId: order._id,
        vendorId: vendor.firebaseUid,
        supplierId: supplierFirebaseUid,
        estimatedDeliveryDate,
        supplierNotes,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      order,
      message: 'Order approved successfully'
    });

  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
};

/**
 * Reject order
 */
export const rejectOrder = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { orderId } = req.params;
    const { rejectionReason } = req.body;

    // Get supplier MongoDB ID
    let supplier = await Supplier.findOne({ firebaseUid: supplierFirebaseUid });
    
    if (!supplier) {
      // Try User model
      const User = (await import('../models/User.js')).default;
      const userSupplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
      if (userSupplier) {
        // Create Supplier record if it doesn't exist
        supplier = new Supplier({
          firebaseUid: supplierFirebaseUid,
          name: userSupplier.name,
          email: userSupplier.email,
          phone: userSupplier.phone,
          businessName: userSupplier.businessName,
          businessType: userSupplier.businessType,
          productCategories: userSupplier.productCategories,
          location: userSupplier.location
        });
        await supplier.save();
      }
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const order = await Order.findOne({ _id: orderId, supplierId: supplier._id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Pending Approval') {
      return res.status(400).json({ error: 'Order cannot be rejected' });
    }

    order.status = 'Rejected';
    order.rejectionReason = rejectionReason;
    await order.save();

    // Get vendor to emit socket event
    const vendor = await Vendor.findById(order.vendorId);
    if (vendor) {
      emitToUser(vendor.firebaseUid, 'order_rejected', {
        orderId: order._id,
        vendorId: vendor.firebaseUid,
        supplierId: supplierFirebaseUid,
        rejectionReason,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      order,
      message: 'Order rejected successfully'
    });

  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
};

/**
 * Dispatch order
 */
export const dispatchOrder = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { orderId } = req.params;

    // Get supplier MongoDB ID
    let supplier = await Supplier.findOne({ firebaseUid: supplierFirebaseUid });
    
    if (!supplier) {
      // Try User model
      const User = (await import('../models/User.js')).default;
      const userSupplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
      if (userSupplier) {
        // Create Supplier record if it doesn't exist
        supplier = new Supplier({
          firebaseUid: supplierFirebaseUid,
          name: userSupplier.name,
          email: userSupplier.email,
          phone: userSupplier.phone,
          businessName: userSupplier.businessName,
          businessType: userSupplier.businessType,
          productCategories: userSupplier.productCategories,
          location: userSupplier.location
        });
        await supplier.save();
      }
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const order = await Order.findOne({ _id: orderId, supplierId: supplier._id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Paid') {
      return res.status(400).json({ error: 'Order must be paid before dispatch' });
    }

    order.status = 'Dispatched';
    await order.save();

    // Get vendor to emit socket event
    const vendor = await Vendor.findById(order.vendorId);
    if (vendor) {
      emitToUser(vendor.firebaseUid, 'order_dispatched', {
        orderId: order._id,
        vendorId: vendor.firebaseUid,
        supplierId: supplierFirebaseUid,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      order,
      message: 'Order dispatched successfully'
    });

  } catch (error) {
    console.error('Dispatch order error:', error);
    res.status(500).json({ error: 'Failed to dispatch order' });
  }
};

/**
 * Mark order as delivered
 */
export const deliverOrder = async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { orderId } = req.params;

    // Get supplier MongoDB ID
    let supplier = await Supplier.findOne({ firebaseUid: supplierFirebaseUid });
    
    if (!supplier) {
      // Try User model
      const User = (await import('../models/User.js')).default;
      const userSupplier = await User.findOne({ firebaseUid: supplierFirebaseUid, role: 'supplier' });
      if (userSupplier) {
        // Create Supplier record if it doesn't exist
        supplier = new Supplier({
          firebaseUid: supplierFirebaseUid,
          name: userSupplier.name,
          email: userSupplier.email,
          phone: userSupplier.phone,
          businessName: userSupplier.businessName,
          businessType: userSupplier.businessType,
          productCategories: userSupplier.productCategories,
          location: userSupplier.location
        });
        await supplier.save();
      }
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const order = await Order.findOne({ _id: orderId, supplierId: supplier._id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Order must be dispatched before delivery' });
    }

    order.status = 'Delivered';
    order.actualDeliveryDate = new Date();
    await order.save();

    // Get vendor to emit socket event
    const vendor = await Vendor.findById(order.vendorId);
    if (vendor) {
      emitToUser(vendor.firebaseUid, 'order_delivered', {
        orderId: order._id,
        vendorId: vendor.firebaseUid,
        supplierId: supplierFirebaseUid,
        actualDeliveryDate: order.actualDeliveryDate,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      order,
      message: 'Order delivered successfully'
    });

  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ error: 'Failed to mark order as delivered' });
  }
}; 