const productService = require('./product.service');
const { validateObjectId, validateProductPayload } = require('./product.validation');

async function getProducts(req, res, next) {
  try {
    const result = await productService.listProducts(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    }

    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const validation = validateProductPayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const isUnique = await productService.ensureUniqueProductCode(validation.value.productCode);

    if (!isUnique) {
      return res.status(409).json({
        success: false,
        message: 'Product code already exists.'
      });
    }

    const product = await productService.createProduct(validation.value, req.user && req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    }

    const validation = validateProductPayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const existingProduct = await productService.getProductById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const isUnique = await productService.ensureUniqueProductCode(
      validation.value.productCode,
      req.params.id
    );

    if (!isUnique) {
      return res.status(409).json({
        success: false,
        message: 'Product code already exists.'
      });
    }

    const product = await productService.updateProduct(
      req.params.id,
      validation.value,
      req.user && req.user.id
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id.' });
    }

    const existingProduct = await productService.getProductById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await productService.softDeleteProduct(req.params.id, req.user && req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
