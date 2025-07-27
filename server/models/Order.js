import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  // Vendor details
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
  vendorPhone: {
    type: String,
    required: true
  },
  vendorLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    lat: Number,
    lng: Number,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
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
  supplierEmail: {
    type: String,
    required: true
  },
  supplierPhone: {
    type: String,
    required: true
  },
  supplierLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    lat: Number,
    lng: Number,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Order details
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid', 'dispatched', 'delivered', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],

  // Delivery details
  deliveryAddress: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  deliveryInstructions: String,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,

  // Payment details
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'bank_transfer', 'Razorpay'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentTransactionId: String,
  
  // Razorpay specific fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentAmount: Number,

  // Additional fields
  notes: String,
  rejectionReason: String,
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ vendorFirebaseUid: 1 });
orderSchema.index({ supplierFirebaseUid: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ vendorLocation: '2dsphere' });
orderSchema.index({ supplierLocation: '2dsphere' });

// Pre-save middleware to add status to history
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order; 