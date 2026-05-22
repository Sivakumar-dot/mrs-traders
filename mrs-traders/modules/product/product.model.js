const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      default: '',
      trim: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: true
    },
    brand: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    uom: {
      type: String,
      default: '',
      trim: true
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: String,
      default: null
    },
    updatedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

productSchema.index(
  { productCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      productCode: { $exists: true, $ne: '' }
    }
  }
);

module.exports = mongoose.model('Product', productSchema);
