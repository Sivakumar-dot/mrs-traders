const Product = require('./product.model');

async function listProducts({ page = 1, limit = 10, search = '' }) {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 10, 1);
  const trimmedSearch = String(search || '').trim();
  const pipeline = [
    {
      $match: {
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: 'productcategories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $addFields: {
        categoryName: {
          $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, '']
        }
      }
    }
  ];

  if (trimmedSearch) {
    pipeline.push({
      $match: {
        $or: [
          { productCode: { $regex: trimmedSearch, $options: 'i' } },
          { productName: { $regex: trimmedSearch, $options: 'i' } },
          { categoryName: { $regex: trimmedSearch, $options: 'i' } }
        ]
      }
    });
  }

  const [result] = await Product.aggregate([
    ...pipeline,
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: (normalizedPage - 1) * normalizedLimit },
          { $limit: normalizedLimit },
          {
            $project: {
              category: 0
            }
          }
        ],
        totalRecords: [{ $count: 'count' }]
      }
    }
  ]);

  const totalRecords = result && result.totalRecords[0]
    ? result.totalRecords[0].count
    : 0;

  return {
    data: result ? result.data : [],
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / normalizedLimit) || 1
    }
  };
}

async function getProductById(productId) {
  return Product.findOne({ _id: productId, isDeleted: false }).populate('categoryId', 'name').lean();
}

async function ensureUniqueProductCode(productCode, excludeId = null) {
  const filter = {
    productCode,
    isDeleted: false
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existingProduct = await Product.findOne(filter).lean();
  return !existingProduct;
}

async function createProduct(payload, userId = null) {
  const product = await Product.create({
    ...payload,
    createdBy: userId,
    updatedBy: userId
  });

  return getProductById(product._id);
}

async function updateProduct(productId, payload, userId = null) {
  await Product.updateOne(
    { _id: productId, isDeleted: false },
    {
      $set: {
        ...payload,
        updatedBy: userId
      }
    }
  );

  return getProductById(productId);
}

async function softDeleteProduct(productId, userId = null) {
  return Product.updateOne(
    { _id: productId, isDeleted: false },
    {
      $set: {
        isDeleted: true,
        updatedBy: userId
      }
    }
  );
}

module.exports = {
  listProducts,
  getProductById,
  ensureUniqueProductCode,
  createProduct,
  updateProduct,
  softDeleteProduct
};
