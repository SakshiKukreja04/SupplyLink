import mongoose from 'mongoose';

const VendorSearchSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  keyword: {
    type: String,
    required: true,
    trim: true
  },
  translatedKeyword: {
    type: String,
    trim: true
  },
  searchResults: {
    type: Number,
    default: 0
  },
  translationInfo: {
    detectedLanguage: String,
    confidence: Number,
    wasTranslated: Boolean,
    fallback: Boolean
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    lat: Number,
    lng: Number
  },
  filters: {
    maxDistance: {
      type: Number,
      default: 10 // km
    },
    minRating: {
      type: Number,
      default: 0
    },
    verifiedOnly: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for analytics and tracking
VendorSearchSchema.index({ vendorId: 1, timestamp: -1 });
VendorSearchSchema.index({ keyword: 1 });
VendorSearchSchema.index({ timestamp: -1 });

const VendorSearch = mongoose.model('VendorSearch', VendorSearchSchema);

export default VendorSearch; 