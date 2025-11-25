import { FilterQuery } from 'mongoose';
import { Product, ProductCreateDTO } from '../models/Product';
import { ProductModel, mapProduct, ProductDocument } from '../db/ProductModel';

export class InventoryService {
  constructor(private readonly lowStockThreshold: number) {}

  async list(): Promise<Product[]> {
    const docs = await ProductModel.find().sort({ updatedAt: -1 }).lean();
    return docs.map(mapProduct);
  }

  async listFiltered(opts: { search?: string; maxUnits?: number; page?: number; pageSize?: number; status?: 'all' | 'low' | 'healthy' }) {
    const { search, maxUnits, page = 1, pageSize = 20, status = 'all' } = opts;

    const filter: FilterQuery<ProductDocument> = {};
    if (search) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } }
      ];
    }
    const quantityFilter: Record<string, number> = {};
    if (maxUnits != null) {
      quantityFilter.$lte = maxUnits;
    }
    if (status === 'low') {
      quantityFilter.$lte = Math.min(quantityFilter.$lte ?? Number.MAX_SAFE_INTEGER, this.lowStockThreshold);
    }
    if (status === 'healthy') {
      quantityFilter.$gt = this.lowStockThreshold;
    }
    if (Object.keys(quantityFilter).length) {
      filter.quantity = quantityFilter;
    }

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ProductModel.countDocuments(filter)
    ]);

    return {
      items: items.map(mapProduct),
      total,
      page,
      pageSize
    };
  }

  async get(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id).lean();
    return doc ? mapProduct(doc) : null;
  }

  async create(data: ProductCreateDTO): Promise<Product> {
    const created = await ProductModel.create({
      name: data.name.trim(),
      sku: data.sku.trim(),
      category: data.category?.trim() || 'Geral',
      purchasePrice: data.purchasePrice,
      salePrice: data.salePrice,
      quantity: data.quantity
    });
    return mapProduct(created);
  }

  async update(id: string, data: Partial<ProductCreateDTO>): Promise<Product | null> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.sku !== undefined) patch.sku = data.sku.trim();
    if (data.category !== undefined) patch.category = data.category.trim();
    if (data.purchasePrice !== undefined) patch.purchasePrice = data.purchasePrice;
    if (data.salePrice !== undefined) patch.salePrice = data.salePrice;
    if (data.quantity !== undefined) patch.quantity = data.quantity;

    if (!Object.keys(patch).length) {
      const found = await ProductModel.findById(id).lean();
      return found ? mapProduct(found) : null;
    }

    const updated = await ProductModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true
    }).lean();
    return updated ? mapProduct(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return Boolean(result);
  }

  async lowStock(): Promise<Product[]> {
    const docs = await ProductModel.find({ quantity: { $lte: this.lowStockThreshold } })
      .sort({ quantity: 1 })
      .lean();
    return docs.map(mapProduct);
  }

  async report() {
    const [stats] = await ProductModel.aggregate<{ totalValue: number; potentialRevenue: number }>([{
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } },
        potentialRevenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } }
      }
    }]);

    const lowStock = await this.lowStock();
    const totalValue = stats?.totalValue ?? 0;
    const potentialRevenue = stats?.potentialRevenue ?? 0;
    const potentialProfit = potentialRevenue - totalValue;

    return { totalValue, potentialRevenue, potentialProfit, lowStock };
  }

  async advancedReport() {
    const [summary] = await ProductModel.aggregate<{
      totalValue: number;
      potentialRevenue: number;
      potentialProfit: number;
    }>([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } },
          potentialRevenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
          potentialProfit: {
            $sum: {
              $subtract: [
                { $multiply: ['$salePrice', '$quantity'] },
                { $multiply: ['$purchasePrice', '$quantity'] }
              ]
            }
          }
        }
      }
    ]);

    const marginByCategory = await ProductModel.aggregate<{
      category: string;
      totalRevenue: number;
      totalValue: number;
      margin: number;
    }>([
      {
        $group: {
          _id: '$category',
          totalRevenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
          totalValue: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } },
          margin: {
            $sum: {
              $subtract: [
                { $multiply: ['$salePrice', '$quantity'] },
                { $multiply: ['$purchasePrice', '$quantity'] }
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ['$_id', 'Geral'] },
          totalRevenue: 1,
          totalValue: 1,
          margin: 1
        }
      },
      { $sort: { margin: -1 } }
    ]);

    const rawProducts = await ProductModel.find().lean();
    const now = Date.now();
    const turnover = rawProducts.map(doc => {
      const ageDays = Math.max(1, Math.round((now - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const velocity = Number((doc.quantity / ageDays).toFixed(2));
      return {
        id: doc._id.toString(),
        name: doc.name,
        sku: doc.sku,
        category: doc.category ?? 'Geral',
        velocity,
        ageDays
      };
    }).sort((a, b) => b.velocity - a.velocity).slice(0, 10);

    const monthlyProjection = await ProductModel.aggregate<{
      year: number;
      month: number;
      potentialRevenue: number;
      totalValue: number;
    }>([
      {
        $group: {
          _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
          potentialRevenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
          totalValue: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          potentialRevenue: 1,
          totalValue: 1
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    return {
      summary: {
        totalValue: summary?.totalValue ?? 0,
        potentialRevenue: summary?.potentialRevenue ?? 0,
        potentialProfit: summary?.potentialProfit ?? 0
      },
      marginByCategory,
      turnover,
      monthlyProjection
    };
  }
}
