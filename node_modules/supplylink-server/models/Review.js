import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // Review details
  vendorId: {
    type: String,
    required: true,
    ref: 'Vendor'
  },
  vendorFirebaseUid: {
    type: String,
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorEmail: {
    type: String,
    required: true
  },
  
  // Supplier details
  supplierId: {
    type: String,
    required: true,
    ref: 'User'
  },
  supplierFirebaseUid: {
    type: String,
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number between 1 and 5'
    }
  },
  isTrusted: {
    type: Boolean,
    required: true
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  
  // Order reference
  orderId: {
    type: String,
    required: true,
    ref: 'Order'
  },
  orderAmount: {
    type: Number,
    required: true
  },
  
  // Review metadata
  isVerified: {
    type: Boolean,
    default: false
  },
  isHelpful: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reviewSchema.index({ supplierId: 1, createdAt: -1 });
reviewSchema.index({ vendorId: 1, supplierId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isTrusted: 1 });
reviewSchema.index({ isVerified: 1 });

// Pre-save middleware to update updatedAt
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to calculate average rating for a supplier
reviewSchema.statics.getAverageRating = async function(supplierId) {
  const result = await this.aggregate([
    { $match: { supplierId: supplierId, isVerified: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        trustedCount: { $sum: { $cond: ['$isTrusted', 1, 0] } }
      }
    }
  ]);
  
  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    trustedCount: result[0].trustedCount
  } : {
    averageRating: 0,
    totalReviews: 0,
    trustedCount: 0
  };
};

const Review = mongoose.model('Review', reviewSchema);
export default Review; 