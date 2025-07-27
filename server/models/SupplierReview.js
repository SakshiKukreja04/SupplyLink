import mongoose from 'mongoose';

const SupplierReviewSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  categories: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    pricing: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
SupplierReviewSchema.index({ supplierId: 1, createdAt: -1 });
SupplierReviewSchema.index({ vendorId: 1, orderId: 1 }, { unique: true });
SupplierReviewSchema.index({ rating: 1 });

// Ensure one review per order per vendor
SupplierReviewSchema.index({ vendorId: 1, orderId: 1 }, { unique: true });

const SupplierReview = mongoose.model('SupplierReview', SupplierReviewSchema);

export default SupplierReview; 