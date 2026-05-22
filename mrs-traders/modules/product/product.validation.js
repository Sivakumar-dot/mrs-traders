const mongoose = require('mongoose');

function normalizeProductPayload(payload = {}) {
  return {
    productCode: String(payload.productCode || '').trim(),
    productName: String(payload.productName || '').trim(),
    categoryId: String(payload.categoryId || '').trim(),
    brand: String(payload.brand || '').trim(),
    description: String(payload.description || '').trim(),
    price: Number(payload.price),
    quantity: Number(payload.quantity),
    uom: String(payload.uom || '').trim(),
    imageUrl: String(payload.imageUrl || '').trim(),
    isActive: Boolean(payload.isActive)
  };
}

function validateProductPayload(payload = {}) {
  const value = normalizeProductPayload(payload);
  const errors = [];

  if (!value.productCode) {
  }

  if (!value.productName) {
    errors.push('Product name is required.');
  }

  if (!value.categoryId) {
    errors.push('Category is required.');
  } else if (!mongoose.Types.ObjectId.isValid(value.categoryId)) {
    errors.push('Category id is invalid.');
  }

  if (!value.imageUrl) {
    errors.push('Image URL is required.');
  }

  if (!Number.isFinite(value.price) || value.price < 0) {
    errors.push('Price cannot be negative.');
  }

  if (!Number.isFinite(value.quantity) || value.quantity < 0) {
    errors.push('Quantity cannot be negative.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value
  };
}

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
  validateProductPayload,
  validateObjectId
};
