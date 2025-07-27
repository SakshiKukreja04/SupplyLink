import SupplierReview from '../models/SupplierReview.js';
import Order from '../models/Order.js';
import Supplier from '../models/Supplier.js';
import Vendor from '../models/Vendor.js';

/**
 * Submit a review for a supplier
 */
export const submitReview = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { orderId, rating, review, categories, isAnonymous } = req.body;

    // Get vendor MongoDB ID
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Validate order exists and belongs to vendor
    const order = await Order.findOne({ _id: orderId, vendorId: vendor._id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({ error: 'Can only review delivered orders' });
    }

    // Check if review already exists
    const existingReview = await SupplierReview.findOne({ vendorId, orderId });
    if (existingReview) {
      return res.status(400).json({ error: 'Review already submitted for this order' });
    }

    // Create review
    const supplierReview = await SupplierReview.create({
      vendorId: vendor._id,
      supplierId: order.supplierId,
      orderId,
      rating,
      review,
      categories,
      isAnonymous
    });

    // Update supplier's average rating
    await updateSupplierRating(order.supplierId);

    res.json({
      success: true,
      review: supplierReview,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

/**
 * Get reviews for a supplier
 */
export const getSupplierReviews = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const query = { supplierId };
    if (rating) query.rating = parseInt(rating);

    const reviews = await SupplierReview.find(query)
      .populate('vendorId', 'name')
      .populate('orderId', 'totalAmount createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupplierReview.countDocuments(query);

    // Calculate average rating
    const avgRating = await SupplierReview.aggregate([
      { $match: { supplierId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      averageRating: avgRating[0]?.avgRating || 0
    });

  } catch (error) {
    console.error('Get supplier reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
};

/**
 * Get vendor's reviews
 */
export const getVendorReviews = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { page = 1, limit = 10 } = req.query;

    // Get vendor MongoDB ID
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const reviews = await SupplierReview.find({ vendorId: vendor._id })
      .populate('supplierId', 'businessName businessType')
      .populate('orderId', 'totalAmount createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupplierReview.countDocuments({ vendorId: vendor._id });

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get vendor reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
};

/**
 * Update a review
 */
export const updateReview = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { reviewId } = req.params;
    const updateData = req.body;

    // Get vendor MongoDB ID
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const review = await SupplierReview.findOneAndUpdate(
      { _id: reviewId, vendorId: vendor._id },
      updateData,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update supplier's average rating
    await updateSupplierRating(review.supplierId);

    res.json({
      success: true,
      review,
      message: 'Review updated successfully'
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (req, res) => {
  try {
    const vendorFirebaseUid = req.user.uid;
    const { reviewId } = req.params;

    // Get vendor MongoDB ID
    const vendor = await Vendor.findOne({ firebaseUid: vendorFirebaseUid });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const review = await SupplierReview.findOneAndDelete({
      _id: reviewId,
      vendorId: vendor._id
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update supplier's average rating
    await updateSupplierRating(review.supplierId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await SupplierReview.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      success: true,
      review,
      message: 'Review marked as helpful'
    });

  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({ error: 'Failed to mark review as helpful' });
  }
};

/**
 * Get review statistics for a supplier
 */
export const getReviewStats = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const stats = await SupplierReview.aggregate([
      { $match: { supplierId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const stat = stats[0];
    const ratingDistribution = stat.ratingDistribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalReviews: stat.totalReviews,
        averageRating: Math.round(stat.averageRating * 10) / 10,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ error: 'Failed to get review statistics' });
  }
};

/**
 * Update supplier's average rating
 */
async function updateSupplierRating(supplierId) {
  try {
    const avgRating = await SupplierReview.aggregate([
      { $match: { supplierId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const averageRating = avgRating[0]?.avgRating || 0;
    const totalReviews = await SupplierReview.countDocuments({ supplierId });

    await Supplier.findByIdAndUpdate(supplierId, {
      'rating.average': Math.round(averageRating * 10) / 10,
      'rating.count': totalReviews
    });
  } catch (error) {
    console.error('Update supplier rating error:', error);
  }
} 