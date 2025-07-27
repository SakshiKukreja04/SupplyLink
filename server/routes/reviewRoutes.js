import express from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import { emitToUser } from '../utils/socketManager.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyFirebaseToken);

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a supplier
 * @access  Private (Vendor only)
 */
router.post('/', async (req, res) => {
  try {
    const { supplierId, orderId, rating, isTrusted, comment } = req.body;
    const vendorFirebaseUid = req.user.uid;

    console.log('Submitting review:', {
      supplierId,
      orderId,
      rating,
      isTrusted,
      comment,
      vendorFirebaseUid
    });

    // Validate required fields
    if (!supplierId || !orderId || !rating || typeof isTrusted !== 'boolean' || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'All fields are required: supplierId, orderId, rating, isTrusted, comment'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating',
        message: 'Rating must be a whole number between 1 and 5'
      });
    }

    // Validate comment length
    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Invalid comment length',
        message: 'Comment must be between 10 and 500 characters'
      });
    }

    // Import models
    const Review = (await import('../models/Review.js')).default;
    const Order = (await import('../models/Order.js')).default;
    const Vendor = (await import('../models/Vendor.js')).default;
    const User = (await import('../models/User.js')).default;

    // Verify vendor exists
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    console.log('Found vendor for review:', {
      vendorId: vendor?._id,
      vendorName: vendor?.name,
      vendorEmail: vendor?.email,
      vendorFirebaseUid: vendor?.firebaseUid
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found',
        message: 'No vendor profile found for this user'
      });
    }

    // Verify order exists and belongs to vendor
    console.log('Looking for order:', {
      orderId,
      vendorFirebaseUid,
      supplierId
    });
    
    const order = await Order.findOne({
      _id: orderId,
      vendorFirebaseUid: vendorFirebaseUid,
      supplierId: supplierId,
      status: { $in: ['dispatched', 'delivered'] }
    });

    if (!order) {
      // Check if order exists but with different status
      const orderExists = await Order.findOne({
        _id: orderId,
        vendorFirebaseUid: vendorFirebaseUid,
        supplierId: supplierId
      });
      
      if (orderExists) {
        console.log('Order found but status is:', orderExists.status);
        return res.status(400).json({
          success: false,
          error: 'Order not eligible for review',
          message: `Order status is '${orderExists.status}'. Only dispatched or delivered orders can be reviewed.`
        });
      } else {
        console.log('Order not found in database');
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          message: 'Order not found or not eligible for review'
        });
      }
    }
    
    console.log('Order found:', {
      orderId: order._id,
      status: order.status,
      supplierId: order.supplierId,
      totalAmount: order.totalAmount
    });

    // Check if review already exists for this order
    const existingReview = await Review.findOne({
      orderId: orderId,
      vendorFirebaseUid: vendorFirebaseUid
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Review already exists',
        message: 'You have already submitted a review for this order'
      });
    }

    // Get supplier details
    const supplier = await User.findOne({ _id: supplierId, role: 'supplier' });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found',
        message: 'Supplier not found'
      });
    }

    // Create review
    const reviewData = {
      vendorId: vendor._id,
      vendorFirebaseUid: vendorFirebaseUid,
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      supplierId: supplierId,
      supplierFirebaseUid: supplier.firebaseUid,
      supplierName: supplier.businessName,
      orderId: orderId,
      orderAmount: order.totalAmount,
      rating: rating,
      isTrusted: isTrusted,
      comment: comment,
      isVerified: true // Mark as verified by default
    };
    
    console.log('Creating review with vendor data:', {
      vendorName: reviewData.vendorName,
      vendorEmail: reviewData.vendorEmail,
      vendorFirebaseUid: reviewData.vendorFirebaseUid
    });
    
    const review = new Review(reviewData);

    await review.save();

    // Update supplier's average rating
    const ratingStats = await Review.getAverageRating(supplierId);
    
    // Update supplier's rating in User model
    await User.findByIdAndUpdate(supplierId, {
      rating: {
        average: ratingStats.averageRating,
        count: ratingStats.totalReviews
      }
    });

    // Emit review submitted event to supplier
    emitToUser(supplier.firebaseUid, 'review_submitted', {
      type: 'review_submitted',
      review: {
        _id: review._id,
        rating: review.rating,
        isTrusted: review.isTrusted,
        comment: review.comment,
        vendorName: review.vendorName,
        orderId: review.orderId,
        orderAmount: review.orderAmount
      },
      message: `You received a ${rating}-star review from ${vendor.name}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      review: {
        _id: review._id,
        rating: review.rating,
        isTrusted: review.isTrusted,
        comment: review.comment,
        supplierName: review.supplierName,
        orderId: review.orderId,
        createdAt: review.createdAt
      },
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit review',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reviews/supplier/:supplierId
 * @desc    Get reviews for a specific supplier
 * @access  Public
 */
router.get('/supplier/:supplierId', async (req, res) => {
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

    // Get reviews
    const reviews = await Review.find({ 
      supplierId: supplierId,
      isVerified: true 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-vendorEmail -supplierFirebaseUid -isReported -reportReason');

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
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reviews/vendor
 * @desc    Get reviews submitted by the current vendor
 * @access  Private (Vendor only)
 */
router.get('/vendor', async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { page = 1, limit = 10 } = req.query;

    const Review = (await import('../models/Review.js')).default;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ vendorFirebaseUid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-vendorEmail -supplierFirebaseUid');

    const totalReviews = await Review.countDocuments({ vendorFirebaseUid });

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews',
      message: error.message
    });
  }
});

export default router; 