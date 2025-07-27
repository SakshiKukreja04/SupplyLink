import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ supplierId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

// Static method to search products by name (case-insensitive)
productSchema.statics.searchByName = function(query, limit = 20) {
  return this.find({
    name: { $regex: query, $options: 'i' },
    isActive: true
  })
  .populate('supplierId', 'name location')
  .limit(limit)
  .sort({ name: 1 });
};

// Static method to search products by category
productSchema.statics.searchByCategory = function(category, limit = 20) {
  return this.find({
    category: { $regex: category, $options: 'i' },
    isActive: true
  })
  .populate('supplierId', 'name location')
  .limit(limit)
  .sort({ name: 1 });
};

// Static method to search products by both name and category
productSchema.statics.searchProducts = function(query, limit = 20) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  })
  .populate('supplierId', 'name location')
  .limit(limit)
  .sort({ name: 1 });
};

const Product = mongoose.model('Product', productSchema);

export default Product; 