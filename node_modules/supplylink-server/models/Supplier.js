import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  // Firebase Auth ID
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  // Location Information
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },
  
  // Business Information
  businessName: {
    type: String,
    trim: true
  },
  
  businessType: {
    type: String,
    enum: ['wholesale', 'manufacturing', 'distributor', 'producer', 'other'],
    default: 'other'
  },
  
  // Product Categories
  productCategories: [{
    type: String,
    enum: ['grains', 'vegetables', 'fruits', 'dairy', 'meat', 'spices', 'electronics', 'other']
  }],
  
  // Business Details
  gstNumber: {
    type: String,
    trim: true
  },
  
  panNumber: {
    type: String,
    trim: true
  },
  
  // Delivery Information
  deliveryRadius: {
    type: Number,
    default: 50, // km
    min: 1,
    max: 500
  },
  
  deliveryCharges: {
    type: Number,
    default: 0
  },
  
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Last Activity
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Rating and Reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Business Hours
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
supplierSchema.index({ 'location.lat': 1, 'location.lng': 1 });
supplierSchema.index({ businessType: 1 });
supplierSchema.index({ productCategories: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ 'rating.average': -1 });

// Static methods
supplierSchema.statics.findByLocation = function(lat, lng, maxDistance = 10) {
  return this.find({
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
    isActive: true
  });
};

supplierSchema.statics.findByCategory = function(category) {
  return this.find({
    productCategories: category,
    isActive: true
  });
};

supplierSchema.statics.updateLastLogin = function(supplierId) {
  return this.findByIdAndUpdate(supplierId, {
    lastLogin: new Date()
  });
};

// Instance methods
supplierSchema.methods.updateLocation = function(lat, lng, address = null) {
  this.location.lat = lat;
  this.location.lng = lng;
  if (address) {
    this.location.address = address;
  }
  return this.save();
};

supplierSchema.methods.addRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

supplierSchema.methods.isOpen = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3);
  const time = now.toTimeString().slice(0, 5);
  
  const hours = this.businessHours[day];
  if (!hours || !hours.open || !hours.close) return true; // Assume open if no hours set
  
  return time >= hours.open && time <= hours.close;
};

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier; 