import mongoose from 'mongoose';

const SearchKeywordSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User with role: 'vendor'
    required: true
  },
  keyword: {
    type: String,
    required: true,
    trim: true
  },
  searchResults: {
    type: Number,
    default: 0
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

SearchKeywordSchema.index({ vendorId: 1, timestamp: -1 });
SearchKeywordSchema.index({ keyword: 1 });
SearchKeywordSchema.index({ timestamp: -1 });

const SearchKeyword = mongoose.model('SearchKeyword', SearchKeywordSchema);
export default SearchKeyword; 