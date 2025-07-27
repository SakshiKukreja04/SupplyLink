import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['vendor', 'supplier'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      // Name is required for vendors, but not for suppliers (they use businessName)
      return this.role === 'vendor';
    }
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  location: {
    // GeoJSON Point format for MongoDB geospatial queries
    type: {
      type: String,
      enum: ['Point']
      // No default to prevent automatic creation
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(coords) {
          // If coordinates are provided, they must be valid
          if (coords && coords.length > 0) {
            return coords.length === 2 && 
                   typeof coords[0] === 'number' && 
                   typeof coords[1] === 'number' &&
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;     // latitude
          }
          // If no coordinates, that's okay (location might be incomplete)
          return true;
        },
        message: 'Coordinates must be [longitude, latitude] array with valid values'
      }
    },
    // Human-readable location data
    lat: Number,
    lng: Number,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // Supplier-specific fields
  businessName: {
    type: String,
    required: function() {
      // Business name is required for suppliers
      return this.role === 'supplier';
    }
  },
  businessType: String,
  category: String, // Main business category
  productCategories: [String], // Array of product categories
  availableItems: [{
    name: String,
    description: String,
    price: Number,
    quantity: Number,
    unit: String,
    category: String,
    isAvailable: {
      type: Boolean,
      default: true
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1
    },
    deliveryTime: {
      type: Number,
      default: 1
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for better profile management
  description: String,
  website: String,
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  paymentMethods: [String],
  deliveryOptions: [String]
}, {
  timestamps: true
});

UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ businessName: 1 });
UserSchema.index({ category: 1 });
UserSchema.index({ 'location.city': 1 });
UserSchema.index({ 'location.state': 1 });

// Geospatial index for location queries
UserSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', UserSchema);
export default User; 