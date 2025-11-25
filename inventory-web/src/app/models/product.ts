export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ProductCreateDTO {
  name: string;
  sku: string;
  category?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventoryReport {
  totalValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  lowStock: Product[];
}

export interface AdvancedReport {
  summary: {
    totalValue: number;
    potentialRevenue: number;
    potentialProfit: number;
  };
  marginByCategory: Array<{
    category: string;
    totalRevenue: number;
    totalValue: number;
    margin: number;
  }>;
  turnover: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    velocity: number;
    ageDays: number;
  }>;
  monthlyProjection: Array<{
    year: number;
    month: number;
    potentialRevenue: number;
    totalValue: number;
  }>;
}
