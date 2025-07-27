import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { emitToUser } from '../utils/socketManager.js';

const router = express.Router();

// Place a new order
router.post('/place', authenticateToken, async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { supplierId, items, deliveryAddress, deliveryInstructions, notes, isUrgent } = req.body;

    // Validate required fields
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
        message: 'Supplier ID and items are required'
      });
    }

    // Get vendor details
    const Vendor = (await import('../models/Vendor.js')).default;
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found',
        message: 'Vendor profile not found. Please update your location first.'
      });
    }

    // Get supplier details
    const User = (await import('../models/User.js')).default;
    const supplier = await User.findOne({ _id: supplierId, role: 'supplier' });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found',
        message: 'Supplier not found or inactive'
      });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const supplierItem = supplier.availableItems.find(availItem => availItem._id.toString() === item.itemId);
      
      if (!supplierItem) {
        return res.status(400).json({
          success: false,
          error: 'Invalid item',
          message: `Item ${item.itemName} not found in supplier's inventory`
        });
      }

      if (!supplierItem.isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Item unavailable',
          message: `Item ${item.itemName} is currently unavailable`
        });
      }

      if (item.quantity < supplierItem.minimumOrderQuantity) {
        return res.status(400).json({
          success: false,
          error: 'Minimum order quantity not met',
          message: `Minimum order quantity for ${item.itemName} is ${supplierItem.minimumOrderQuantity} ${supplierItem.unit}`
        });
      }

      const itemTotalPrice = supplierItem.price * item.quantity;
      totalAmount += itemTotalPrice;

      validatedItems.push({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: supplierItem.unit,
        price: supplierItem.price,
        totalPrice: itemTotalPrice
      });
    }

    // Create order
    const Order = (await import('../models/Order.js')).default;
    const order = new Order({
      // Vendor details
      vendorId: vendor._id.toString(),
      vendorFirebaseUid: vendor.firebaseUid,
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      vendorPhone: vendor.phone,
      vendorLocation: vendor.location,

      // Supplier details
      supplierId: supplier._id.toString(),
      supplierFirebaseUid: supplier.firebaseUid,
      supplierName: supplier.businessName,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phone,
      supplierLocation: supplier.location,

      // Order details
      items: validatedItems,
      totalAmount,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed by vendor'
      }],

      // Delivery details
      deliveryAddress: deliveryAddress || vendor.location,
      deliveryInstructions,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now

      // Additional fields
      notes,
      isUrgent: isUrgent || false
    });

    await order.save();

    console.log(`Order placed: ${order._id} by vendor ${vendor.name} to supplier ${supplier.businessName}`);

    // Emit real-time order request to supplier with full vendor details
    emitToUser(supplier.firebaseUid, 'order_request', {
      type: 'new_order_request',
      order: {
        _id: order._id,
        vendorId: vendor._id,
        vendorFirebaseUid: vendor.firebaseUid,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        vendorPhone: vendor.phone,
        vendorLocation: vendor.location,
        items: validatedItems,
        totalAmount,
        deliveryAddress,
        deliveryInstructions,
        notes,
        isUrgent: isUrgent || false,
        status: 'pending',
        createdAt: order.createdAt
      },
      message: 'New order request received from vendor',
      timestamp: new Date().toISOString()
    });

    // Emit order confirmation to vendor
    emitToUser(vendor.firebaseUid, 'order_placed', {
      type: 'order_request_sent',
      order: {
        _id: order._id,
        supplierId: supplier._id,
        supplierName: supplier.businessName,
        items: validatedItems,
        totalAmount,
        status: 'pending',
        createdAt: order.createdAt
      },
      message: 'Order request sent. Waiting for supplier approval...',
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        supplierName: supplier.businessName,
        totalAmount,
        items: validatedItems,
        status: 'pending',
        createdAt: order.createdAt,
        expectedDeliveryDate: order.expectedDeliveryDate
      },
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place order',
      message: error.message
    });
  }
});

// Get vendor's orders
router.get('/vendor', authenticateToken, async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { status, limit = 20, page = 1 } = req.query;

    const Order = (await import('../models/Order.js')).default;
    
    const query = { vendorFirebaseUid };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('supplierId', 'businessName email phone location');

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// Get supplier's orders
router.get('/supplier', authenticateToken, async (req, res) => {
  try {
    const supplierFirebaseUid = req.user.uid;
    const { status, limit = 20, page = 1 } = req.query;

    const Order = (await import('../models/Order.js')).default;
    
    const query = { supplierFirebaseUid };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('vendorId', 'name email phone location');

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// Get specific order details
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userFirebaseUid = req.user.uid;

    const Order = (await import('../models/Order.js')).default;
    
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { vendorFirebaseUid: userFirebaseUid },
        { supplierFirebaseUid: userFirebaseUid }
      ]
    }).populate('supplierId', 'businessName email phone location')
      .populate('vendorId', 'name email phone location');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'Order not found or access denied'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details',
      message: error.message
    });
  }
});

// Approve order (supplier only)
router.patch('/:orderId/approve', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const supplierFirebaseUid = req.user.uid;
    const { notes } = req.body;

    const Order = (await import('../models/Order.js')).default;
    
    // Find order and verify supplier ownership
    const order = await Order.findOne({
      _id: orderId,
      supplierFirebaseUid: supplierFirebaseUid,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'Order not found or already processed'
      });
    }

    // Update order status
    order.status = 'approved';
    order.statusHistory.push({
      status: 'approved',
      timestamp: new Date(),
      note: notes || 'Order approved by supplier'
    });
    order.updatedAt = new Date();

    await order.save();

    // Emit real-time approval to vendor
    const { emitToUser } = await import('../utils/socketManager.js');
    emitToUser(order.vendorFirebaseUid, 'order_approved', {
      type: 'order_approved',
      order: {
        _id: order._id,
        supplierName: order.supplierName,
        status: 'approved',
        updatedAt: order.updatedAt
      },
      message: 'Your order has been approved by the supplier',
      timestamp: new Date().toISOString()
    });

    // Emit confirmation to supplier
    emitToUser(supplierFirebaseUid, 'order_approval_sent', {
      type: 'order_approval_sent',
      order: {
        _id: order._id,
        vendorName: order.vendorName,
        status: 'approved',
        updatedAt: order.updatedAt
      },
      message: 'Order approval sent to vendor',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: 'approved',
        updatedAt: order.updatedAt
      },
      message: 'Order approved successfully'
    });

  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve order',
      message: error.message
    });
  }
});

// Reject order (supplier only)
router.patch('/:orderId/reject', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const supplierFirebaseUid = req.user.uid;
    const { reason } = req.body;

    const Order = (await import('../models/Order.js')).default;
    
    // Find order and verify supplier ownership
    const order = await Order.findOne({
      _id: orderId,
      supplierFirebaseUid: supplierFirebaseUid,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'Order not found or already processed'
      });
    }

    // Update order status
    order.status = 'rejected';
    order.statusHistory.push({
      status: 'rejected',
      timestamp: new Date(),
      note: reason || 'Order rejected by supplier'
    });
    order.updatedAt = new Date();

    await order.save();

    // Emit real-time rejection to vendor
    const { emitToUser } = await import('../utils/socketManager.js');
    emitToUser(order.vendorFirebaseUid, 'order_rejected', {
      type: 'order_rejected',
      order: {
        _id: order._id,
        supplierName: order.supplierName,
        status: 'rejected',
        reason: reason || 'Order rejected by supplier',
        updatedAt: order.updatedAt
      },
      message: 'Your order has been rejected by the supplier',
      timestamp: new Date().toISOString()
    });

    // Emit confirmation to supplier
    emitToUser(supplierFirebaseUid, 'order_rejection_sent', {
      type: 'order_rejection_sent',
      order: {
        _id: order._id,
        vendorName: order.vendorName,
        status: 'rejected',
        updatedAt: order.updatedAt
      },
      message: 'Order rejection sent to vendor',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: 'rejected',
        updatedAt: order.updatedAt
      },
      message: 'Order rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject order',
      message: error.message
    });
  }
});

// Dispatch order (supplier only)
router.patch('/:orderId/dispatch', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const supplierFirebaseUid = req.user.uid;

    const Order = (await import('../models/Order.js')).default;
    
    // Find order and verify supplier ownership
    const order = await Order.findOne({
      _id: orderId,
      supplierFirebaseUid: supplierFirebaseUid,
      status: { $in: ['paid', 'approved'] }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'Order not found or not eligible for dispatch'
      });
    }

    // Update order status to dispatched
    order.status = 'dispatched';
    order.statusHistory.push({
      status: 'dispatched',
      timestamp: new Date(),
      note: 'Order has been dispatched by supplier'
    });

    await order.save();

    // Emit dispatch event to vendor
    const { emitToUser } = await import('../utils/socketManager.js');
    emitToUser(order.vendorFirebaseUid, 'order_dispatched', {
      type: 'order_dispatched',
      order: {
        _id: order._id,
        supplierName: order.supplierName,
        supplierId: order.supplierId,
        status: 'dispatched',
        updatedAt: order.updatedAt,
        totalAmount: order.totalAmount,
        items: order.items
      },
      message: `Order #${order._id.toString().slice(-6)} has been successfully dispatched by ${order.supplierName}`,
      timestamp: new Date().toISOString()
    });

    // Emit confirmation to supplier
    emitToUser(supplierFirebaseUid, 'order_dispatch_sent', {
      type: 'order_dispatch_sent',
      order: {
        _id: order._id,
        vendorName: order.vendorName,
        status: 'dispatched',
        updatedAt: order.updatedAt
      },
      message: 'Order dispatch notification sent to vendor',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: 'dispatched',
        updatedAt: order.updatedAt
      },
      message: 'Order dispatched successfully'
    });

  } catch (error) {
    console.error('Error dispatching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dispatch order',
      message: error.message
    });
  }
});

export default router; 