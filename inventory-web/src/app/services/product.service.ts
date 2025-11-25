import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, ProductCreateDTO, ProductListResponse, InventoryReport, AdvancedReport } from '../models/product';
import { firstValueFrom } from 'rxjs';

const API_BASE = 'http://localhost:3000';

export type ProductQuery = {
  search?: string;
  maxUnits?: number;
  page?: number;
  pageSize?: number;
  status?: 'all' | 'low' | 'healthy';
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  products = signal<Product[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);
  report = signal<InventoryReport | null>(null);
  lowStock = signal<Product[]>([]);
  advancedReport = signal<AdvancedReport | null>(null);
  private currentQuery: ProductQuery = {};

  constructor(private http: HttpClient) {}

  async load(params?: ProductQuery) {
    if (params) {
      this.currentQuery = { ...params };
    }
    const query = params ?? this.currentQuery;
    let httpParams = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== '') httpParams = httpParams.set(k, String(v));
    });

    const res = await firstValueFrom(this.http.get<Product[] | ProductListResponse>(`${API_BASE}/products`, { params: httpParams }));
    if (Array.isArray(res)) {
      this.products.set(res);
      this.total.set(res.length);
      this.page.set(1);
      this.pageSize.set(res.length);
      this.lowStock.set(res.filter(p => p.quantity <= 5));
      this.currentQuery = { ...query, page: 1, pageSize: res.length };
    } else {
      this.products.set(res.items);
      this.total.set(res.total);
      this.page.set(res.page);
      this.pageSize.set(res.pageSize);
      this.currentQuery = { ...query, page: res.page, pageSize: res.pageSize };
    }
  }

  async loadLowStock() {
    const res = await firstValueFrom(this.http.get<Product[]>(`${API_BASE}/products/low-stock`));
    this.lowStock.set(res);
  }

  async fetchReport() {
    const res = await firstValueFrom(this.http.get<InventoryReport>(`${API_BASE}/reports`));
    this.report.set(res);
    this.lowStock.set(res.lowStock);
  }

  async fetchAdvancedReport() {
    const res = await firstValueFrom(this.http.get<AdvancedReport>(`${API_BASE}/reports/advanced`));
    this.advancedReport.set(res);
    return res;
  }

  async create(data: ProductCreateDTO) {
    const created = await firstValueFrom(this.http.post<Product>(`${API_BASE}/products`, data));
    await this.load();
    return created;
  }

  async update(id: string, data: Partial<ProductCreateDTO>) {
    const updated = await firstValueFrom(this.http.put<Product>(`${API_BASE}/products/${id}`, data));
    await this.load();
    return updated;
  }

  async delete(id: string) {
    await firstValueFrom(this.http.delete(`${API_BASE}/products/${id}`));
    await this.load();
  }
}
