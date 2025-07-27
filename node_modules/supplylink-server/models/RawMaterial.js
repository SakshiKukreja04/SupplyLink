import mongoose from 'mongoose';

const RawMaterialSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User with role: 'supplier'
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'ton', 'piece', 'liter', 'meter', 'sqft'],
    default: 'kg'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  minimumOrderQuantity: {
    type: Number,
    default: 1
  },
  deliveryTime: {
    type: Number, // in days
    default: 1
  }
}, {
  timestamps: true
});

RawMaterialSchema.index({ supplierId: 1, name: 1 });
RawMaterialSchema.index({ category: 1 });
RawMaterialSchema.index({ name: 'text', description: 'text' });

const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);
export default RawMaterial; 