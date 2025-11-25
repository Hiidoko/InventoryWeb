export interface Product {
  id: string; // UUID interno
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateDTO {
  name: string;
  sku: string;
  category?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
}

export function validateProductInput(data: ProductCreateDTO): string[] {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('Nome é obrigatório');
  if (!data.sku?.trim()) errors.push('SKU é obrigatório');
  if (data.category !== undefined && !data.category.trim()) errors.push('Categoria inválida');
  if (data.purchasePrice == null || data.purchasePrice < 0) errors.push('Preço de compra inválido');
  if (data.salePrice == null || data.salePrice < 0) errors.push('Preço de venda inválido');
  if (data.quantity == null || data.quantity < 0) errors.push('Quantidade inválida');
  return errors;
}
