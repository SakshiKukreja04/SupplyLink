import express from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import razorpayInstance from '../config/razorpay.js';
import { emitToUser } from '../utils/socketManager.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyFirebaseToken);

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order
 * @access  Private
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, orderId, vendorId, supplierId } = req.body;
    const vendorFirebaseUid = req.user.uid;

    console.log('Creating Razorpay order with data:', {
      amount,
      orderId,
      vendorId,
      supplierId,
      vendorFirebaseUid
    });

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing order ID',
        message: 'Order ID is required'
      });
    }

    // Check if Razorpay is properly configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || keyId === 'rzp_test_YOUR_KEY_ID' || !keySecret || keySecret === 'YOUR_KEY_SECRET') {
      return res.status(500).json({
        success: false,
        error: 'Payment gateway not configured',
        message: 'Razorpay keys not configured. Please add your keys to server/.env'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: `order_${orderId.slice(-8)}_${Date.now().toString().slice(-8)}`, // Limit receipt length to 40 chars
      notes: {
        orderId: orderId,
        vendorId: vendorId,
        supplierId: supplierId,
        vendorFirebaseUid: vendorFirebaseUid
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
    // Handle Razorpay API errors
    if (error.statusCode === 400 && error.error && error.error.description) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay validation error',
        message: error.error.description
      });
    }
    
    // Check if it's a Razorpay configuration error
    if (error.message && (error.message.includes('Invalid key') || error.message.includes('authentication'))) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay configuration error',
        message: 'Payment gateway not configured properly. Please check Razorpay keys.'
      });
    }
    
    // Check if it's a validation error
    if (error.message && (error.message.includes('amount') || error.message.includes('currency'))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment parameters',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      message: error.message || 'Unknown error occurred'
    });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment and update order status
 * @access  Private
 */
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature, 
      orderId,
      amount 
    } = req.body;
    
    const vendorFirebaseUid = req.user.uid;

    // Verify payment signature
    const crypto = await import('crypto');
    const expectedSignature = crypto.default
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
        message: 'Payment verification failed'
      });
    }

    // Update order in database
    const Order = (await import('../models/Order.js')).default;
    const Vendor = (await import('../models/Vendor.js')).default;
    
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found for this user'
      });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      vendorId: vendor._id,
      status: 'approved'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'Order not found or not approved for payment'
      });
    }

         // Update order with payment details
     order.status = 'paid';
     order.paymentStatus = 'paid';
     order.paymentMethod = 'Razorpay';
     order.paymentTransactionId = razorpayPaymentId;
     order.razorpayOrderId = razorpayOrderId;
     order.razorpayPaymentId = razorpayPaymentId;
     order.razorpaySignature = razorpaySignature;
     order.paymentAmount = amount;
     order.paymentDate = new Date();
     
     // Add to status history
     order.statusHistory.push({
       status: 'paid',
       timestamp: new Date(),
       note: `Payment completed via Razorpay. Payment ID: ${razorpayPaymentId}`
     });

     await order.save();

     // Get supplier to emit socket event
     const User = (await import('../models/User.js')).default;
     const supplier = await User.findOne({ _id: order.supplierId, role: 'supplier' });
     
     if (supplier) {
       // Emit payment_done event to both supplier and vendor
       const paymentDoneData = {
         orderId: order._id,
         vendorId: vendorFirebaseUid,
         supplierId: supplier.firebaseUid,
         vendorName: vendor.name,
         supplierName: supplier.businessName,
         amount: order.totalAmount,
         paymentMethod: 'Razorpay',
         razorpayPaymentId: razorpayPaymentId,
         paymentStatus: 'paid',
         timestamp: new Date()
       };
       
       // Emit to supplier
       emitToUser(supplier.firebaseUid, 'payment_done', paymentDoneData);
       
       // Emit to vendor
       emitToUser(vendorFirebaseUid, 'payment_done', paymentDoneData);
       
       // Also emit the original events for backward compatibility
       emitToUser(supplier.firebaseUid, 'payment_made', {
         orderId: order._id,
         vendorId: vendorFirebaseUid,
         supplierId: supplier.firebaseUid,
         amount: order.totalAmount,
         paymentMethod: 'Razorpay',
         razorpayPaymentId: razorpayPaymentId,
         timestamp: new Date()
       });
       
       emitToUser(vendorFirebaseUid, 'payment_confirmed', {
         orderId: order._id,
         supplierId: supplier.firebaseUid,
         supplierName: supplier.businessName,
         amount: order.totalAmount,
         paymentMethod: 'Razorpay',
         razorpayPaymentId: razorpayPaymentId,
         timestamp: new Date()
       });
     }

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: 'paid',
        paymentId: razorpayPaymentId,
        amount: order.totalAmount
      },
      message: 'Payment verified and order updated successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

export default router; 