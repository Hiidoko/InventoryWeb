import { Schema, model, Document, Model } from 'mongoose';
import { Product } from '../models/Product';

export interface ProductDocument extends Document {
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      minlength: 2,
      maxlength: 50
    },
    category: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
      default: 'Geral'
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.index({ name: 'text', sku: 'text' });

export interface ProductModelType extends Model<ProductDocument> {}

export const ProductModel = model<ProductDocument, ProductModelType>('Product', productSchema);

export function mapProduct(doc: any): Product {
  const source: any = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: source._id.toString(),
    name: source.name,
    sku: source.sku,
    category: source.category ?? 'Geral',
    purchasePrice: source.purchasePrice,
    salePrice: source.salePrice,
    quantity: source.quantity,
    createdAt: new Date(source.createdAt),
    updatedAt: new Date(source.updatedAt)
  };
}
