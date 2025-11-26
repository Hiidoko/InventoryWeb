import { Component, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="page-header">
    <div class="headline">
      <h2>Painel de Estoque</h2>
      <p>Visualize indicadores de performance, acompanhe o giro e antecipe reposições com confiança.</p>
    </div>
    <div class="header-actions">
      <button type="button" class="btn ghost" (click)="refreshReport()">
        <span class="leading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M4 4v6h6" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M6.5 17.5A7 7 0 0 1 5 12c0-3.87 3.13-7 7-7 2.18 0 4.12 1 5.39 2.57"></path>
            <path d="M17.5 6.5A7 7 0 0 1 19 12c0 3.87-3.13 7-7 7-2.18 0-4.12-1-5.39-2.57"></path>
          </svg>
        </span>
        Sincronizar dados
      </button>
      <button type="button" class="btn primary" routerLink="/new">
        <span class="leading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 5v14" stroke-linecap="round"></path>
            <path d="M5 12h14" stroke-linecap="round"></path>
          </svg>
        </span>
        Novo Produto
      </button>
    </div>
  </div>

  <section class="metrics-grid">
    <article class="metric-card">
      <span class="metric-label">Itens cadastrados</span>
      <strong class="metric-value">{{ total() | number }}</strong>
      <span class="metric-trend" [class.positive]="total() > 0 && products().length === total()">
        {{ products().length }} visíveis nesta página
      </span>
    </article>
    <article class="metric-card focus">
      <span class="metric-label">Valor de estoque</span>
      <strong class="metric-value">{{ (report()?.totalValue ?? 0) | currency:'BRL':'symbol-narrow':'1.0-0' }}</strong>
      <span class="metric-trend">Margem potencial: {{ (report()?.potentialProfit ?? 0) | currency:'BRL' }}</span>
    </article>
    <article class="metric-card warning">
      <span class="metric-label">Itens críticos</span>
      <strong class="metric-value">{{ lowStock().length }}</strong>
      <span class="metric-trend">Revisar níveis mínimos e sugerir reposição</span>
    </article>
  </section>

  <section class="panel filters-panel">
    <header class="panel-header">
      <div>
        <h3>Filtros inteligentes</h3>
        <p>Refine rapidamente por SKU, nome ou volume em estoque.</p>
      </div>
    </header>
    <div class="filters">
      <label class="field">
        <span>Buscar</span>
        <input placeholder="Nome, categoria ou SKU" [(ngModel)]="search" (ngModelChange)="onFilterChange()" />
      </label>
      <label class="field">
        <span>Estoque abaixo de</span>
        <input type="number" min="0" placeholder="Ex.: 15" [(ngModel)]="maxUnits" (ngModelChange)="onFilterChange()" />
      </label>
      <label class="field compact">
        <span>Itens por página</span>
        <select [(ngModel)]="pageSize" (change)="onFilterChange()">
          <option *ngFor="let size of [10,20,50]" [value]="size">{{ size }}</option>
        </select>
      </label>
      <label class="field compact">
        <span>Status</span>
        <select [(ngModel)]="status" (change)="onFilterChange()">
          <option value="all">Todos</option>
          <option value="low">Críticos</option>
          <option value="healthy">Saudáveis</option>
        </select>
      </label>
    </div>
  </section>

  <section class="panel table-panel">
    <header class="panel-header">
      <div>
        <h3>Lista de produtos</h3>
        <p>Controle granular do estoque com indicadores financeiros.</p>
      </div>
      <span class="badge" *ngIf="lowStock().length">{{ lowStock().length }} com atenção imediata</span>
    </header>

    <div class="table-wrapper" *ngIf="products().length; else empty">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Compra</th>
            <th>Venda</th>
            <th>Status</th>
            <th class="actions-col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products()" [class.low-stock]="isLowStock(p)" (click)="openEdit(p)" class="row-action">
            <td>
              <div class="product-meta">
                <div class="avatar">{{ p.name | slice:0:1 }}</div>
                <div>
                  <span class="name">{{ p.name }}</span>
                  <span class="sku">SKU {{ p.sku }}</span>
                  <span class="category">{{ p.category }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="price">{{ p.purchasePrice | currency:'BRL':'symbol-narrow':'1.2-2' }}</div>
            </td>
            <td>
              <div class="price">{{ p.salePrice | currency:'BRL':'symbol-narrow':'1.2-2' }}</div>
              <span class="margin-chip" *ngIf="p.salePrice - p.purchasePrice >= 0">
                Lucro unitário {{ (p.salePrice - p.purchasePrice) | currency:'BRL':'symbol-narrow':'1.2-2' }}
              </span>
            </td>
            <td>
              <div class="stock-status">
                <span class="quantity" [class.danger]="isLowStock(p)">{{ p.quantity }} unidades</span>
                <span class="chip" [class.chip-warning]="isLowStock(p)">
                  {{ isLowStock(p) ? 'Atenção' : 'Saudável' }}
                </span>
              </div>
            </td>
            <td class="actions-col">
              <div class="actions">
                <button type="button" class="btn icon" (click)="inc(p,1); $event.stopPropagation()">+</button>
                <button type="button" class="btn icon" (click)="dec(p,1); $event.stopPropagation()" [disabled]="p.quantity<=0">-</button>
                <button type="button" class="btn ghost" (click)="openLot(p); $event.stopPropagation()">Novo lote</button>
                <button type="button" class="btn danger" (click)="remove(p); $event.stopPropagation()">Excluir</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #empty>
      <div class="empty-state">
        <div class="empty-graphic" aria-hidden="true">
          <svg viewBox="0 0 32 20" width="32" height="20" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="2" y="8" width="6" height="10" rx="1"></rect>
            <rect x="12" y="4" width="6" height="14" rx="1"></rect>
            <rect x="22" y="1" width="6" height="17" rx="1"></rect>
            <line x1="1" y1="19" x2="31" y2="19"></line>
          </svg>
        </div>
        <h4>Nenhum produto localizado</h4>
        <p>Utilize os filtros acima ou cadastre um novo item para começar a visualizar o desempenho.</p>
        <button type="button" class="btn primary" routerLink="/new">Cadastrar primeiro produto</button>
      </div>
    </ng-template>

    <div class="pagination" *ngIf="total()>pageSize">
      <button type="button" class="btn ghost" (click)="prev()" [disabled]="page()===1">Anterior</button>
      <span>Página {{page()}} de {{ totalPages() }}</span>
      <button type="button" class="btn ghost" (click)="next()" [disabled]="page()===totalPages()">Próxima</button>
    </div>
  </section>

  <div class="modal-backdrop" *ngIf="lotTarget as target">
    <div class="modal-card">
      <header class="modal-header">
        <div>
          <h3>Registrar novo lote</h3>
          <p>Atualize rapidamente o estoque do produto <strong>{{ target.name }}</strong>.</p>
        </div>
        <button type="button" class="btn ghost" (click)="closeLot()">Fechar</button>
      </header>

      <div class="modal-body">
        <div class="mode-switch">
          <button type="button" class="mode-btn" [class.active]="lotMode==='add'" (click)="setLotMode('add')">
            Entrada de itens
          </button>
          <button type="button" class="mode-btn" [class.active]="lotMode==='remove'" (click)="setLotMode('remove')">
            Saída / Ajuste
          </button>
        </div>

        <div class="lot-grid">
          <label class="field">
            <span>Quantidade</span>
            <input type="number" min="1" placeholder="Ex.: 25" [(ngModel)]="lotAmount" (input)="lotError=''" />
          </label>
          <label class="field">
            <span>Saldo atual</span>
            <input type="number" [value]="target.quantity" disabled />
          </label>
        </div>

        <p class="lot-feedback" *ngIf="lotError">{{ lotError }}</p>

        <div class="lot-preview">
          <span>Saldo projetado:</span>
          <strong>{{ projectedQuantity(target) }} unidades</strong>
        </div>
      </div>

      <footer class="modal-footer">
        <button type="button" class="btn ghost" (click)="closeLot()">Cancelar</button>
        <button type="button" class="btn primary" (click)="applyLot()">Aplicar lote</button>
      </footer>
    </div>
  </div>

  <div class="modal-backdrop" *ngIf="editTarget as edit">
    <div class="modal-card">
      <form (ngSubmit)="applyEdit()" #editForm="ngForm" novalidate>
        <header class="modal-header">
          <div>
            <h3>Editar produto</h3>
            <p>Ajuste nome, categoria e valores financeiros para manter os dados atualizados.</p>
          </div>
          <button type="button" class="btn ghost" (click)="closeEdit()">Fechar</button>
        </header>

        <div class="modal-body edit-grid">
          <label class="field">
            <span>Nome</span>
            <input name="editName" [(ngModel)]="editModel.name" required />
          </label>
          <label class="field">
            <span>Categoria</span>
            <input name="editCategory" [(ngModel)]="editModel.category" required />
          </label>
          <label class="field">
            <span>Preço compra</span>
            <input type="number" name="editPurchase" [(ngModel)]="editModel.purchasePrice" required min="0" step="0.01" />
          </label>
          <label class="field">
            <span>Preço venda</span>
            <input type="number" name="editSale" [(ngModel)]="editModel.salePrice" required min="0" step="0.01" />
          </label>
        </div>

        <p class="lot-feedback" *ngIf="editError">{{ editError }}</p>

        <footer class="modal-footer">
          <button type="button" class="btn ghost" (click)="closeEdit()">Cancelar</button>
          <button type="submit" class="btn primary" [disabled]="editForm.invalid">Salvar alterações</button>
        </footer>
      </form>
    </div>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      color: var(--text);
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1.75rem;
    }

    .headline h2 {
      font-size: clamp(1.4rem, 3vw, 1.9rem);
      margin-bottom: 0.35rem;
    }

    .headline p {
      margin: 0;
      color: var(--text-muted);
      max-width: 520px;
      font-size: 0.98rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.65rem 1.1rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(148, 163, 184, 0.18);
      color: var(--text);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 30px -18px rgba(15, 23, 42, 0.45);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn.primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      box-shadow: 0 15px 35px -18px rgba(79, 70, 229, 0.8);
    }

    .btn.primary:hover {
      filter: brightness(1.05);
    }

    .btn.ghost {
      background: rgba(148, 163, 184, 0.14);
      color: var(--text);
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.28);
    }

    .btn.icon {
      padding: 0.45rem 0.55rem;
      font-size: 0.9rem;
      font-weight: 700;
      background: rgba(79, 70, 229, 0.12);
      width: 34px;
      justify-content: center;
    }

    .btn.danger {
      background: rgba(220, 38, 38, 0.17);
      color: var(--danger);
      font-weight: 600;
    }

    .btn.danger:hover {
      background: rgba(220, 38, 38, 0.28);
    }

    .btn.primary,
    .btn.ghost {
      min-height: 44px;
    }

    .leading-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .leading-icon svg {
      display: block;
    }

    .metrics-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin-bottom: 1.5rem;
    }

    .metric-card {
      background: linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(244, 246, 255, 0.95));
      padding: 1.35rem;
      border-radius: var(--radius-md);
      border: 1px solid rgba(79, 70, 229, 0.08);
      box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.9);
      display: grid;
      gap: 0.45rem;
    }

    .metric-card.focus {
      background: linear-gradient(160deg, rgba(79, 70, 229, 0.12), rgba(14, 116, 144, 0.1), #fff);
      border-color: rgba(79, 70, 229, 0.3);
    }

    .metric-card.warning {
      background: linear-gradient(160deg, rgba(248, 113, 113, 0.12), rgba(251, 191, 36, 0.12), #fff);
      border-color: rgba(249, 115, 22, 0.25);
    }

    .metric-label {
      text-transform: uppercase;
      letter-spacing: 0.08rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .metric-value {
      font-size: clamp(1.4rem, 3vw, 1.95rem);
      font-weight: 700;
      color: var(--text);
    }

    .metric-trend {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .metric-trend.positive {
      color: var(--success);
    }

    .panel {
      background: rgba(255, 255, 255, 0.92);
      border-radius: var(--radius-md);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 14px 35px -28px rgba(15, 23, 42, 0.75);
      padding: 1.5rem clamp(1.25rem, 2vw, 2rem);
      margin-bottom: 1.5rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.2rem;
    }

    .panel-header h3 {
      margin: 0 0 0.25rem;
    }

    .panel-header p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .field {
      display: grid;
      gap: 0.45rem;
      flex: 1;
      min-width: 200px;
    }

    .field.compact {
      max-width: 180px;
      min-width: auto;
    }

    .field span {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    input, select {
      padding: 0.75rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: rgba(248, 250, 252, 0.95);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input:focus, select:focus {
      border-color: rgba(79, 70, 229, 0.45);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
    }

    input[disabled] {
      background: rgba(148, 163, 184, 0.12);
      color: var(--text-muted);
    }

    .badge {
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.8rem;
      background: rgba(220, 38, 38, 0.12);
      color: var(--danger);
    }

    .table-wrapper {
      overflow-x: auto;
      border-radius: calc(var(--radius-md) - 8px);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255, 255, 255, 0.96);
    }

    th, td {
      padding: 1rem 1.2rem;
      text-align: left;
      font-size: 0.95rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    }

    thead {
      background: var(--surface-alt);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05rem;
      font-size: 0.78rem;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: var(--surface-hover);
    }

    .row-action {
      cursor: pointer;
    }

    tr.low-stock {
      background: rgba(255, 234, 234, 0.55);
    }

    .product-meta {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: rgba(79, 70, 229, 0.18);
      color: var(--primary-dark);
      display: grid;
      place-items: center;
      font-weight: 600;
    }

    .name {
      font-weight: 600;
      color: var(--text);
      display: block;
      margin-bottom: 0.2rem;
    }

    .sku {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .category {
      display: inline-flex;
      margin-top: 0.25rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05rem;
      background: rgba(79, 70, 229, 0.12);
      color: var(--primary-dark);
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
    }

    .price {
      font-weight: 600;
      color: var(--text);
    }

    .margin-chip {
      display: inline-block;
      margin-top: 0.35rem;
      font-size: 0.75rem;
      background: var(--primary-muted);
      color: var(--primary-dark);
      padding: 0.35rem 0.6rem;
      border-radius: 999px;
    }

    .stock-status {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      align-items: flex-start;
    }

    .quantity {
      font-weight: 600;
      color: var(--text);
    }

    .quantity.danger {
      color: var(--danger);
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.6rem;
      border-radius: 999px;
      font-size: 0.78rem;
      background: rgba(34, 197, 94, 0.12);
      color: var(--success);
      font-weight: 600;
    }

    .chip-warning {
      background: rgba(251, 191, 36, 0.16);
      color: #b45309;
    }

    .actions-col {
      width: 260px;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .empty-state {
      display: grid;
      justify-items: center;
      gap: 0.65rem;
      text-align: center;
      padding: 2.5rem 1.5rem;
      background: rgba(248, 250, 252, 0.75);
      border-radius: var(--radius-md);
      border: 1px dashed rgba(148, 163, 184, 0.35);
    }

    .empty-graphic {
      color: var(--primary-dark);
    }

    .empty-graphic svg {
      display: block;
    }

    .pagination {
      margin-top: 1.4rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      color: var(--text-muted);
    }

    .mode-switch {
      display: inline-flex;
      background: rgba(148, 163, 184, 0.15);
      padding: 0.25rem;
      border-radius: 999px;
      margin-bottom: 1.25rem;
      gap: 0.25rem;
    }

    .mode-btn {
      border: none;
      border-radius: 999px;
      padding: 0.45rem 1rem;
      font-weight: 600;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mode-btn.active {
      background: #fff;
      color: var(--primary);
      box-shadow: 0 10px 25px -20px rgba(79, 70, 229, 0.7);
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      display: grid;
      place-items: center;
      padding: 1.5rem;
      z-index: 1000;
      overflow-y: auto;
    }

    .modal-card {
      width: min(540px, 100%);
      background: rgba(255, 255, 255, 0.98);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 24px 58px -28px rgba(15, 23, 42, 0.75);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 1.25rem;
      padding: clamp(1.5rem, 3vw, 2rem);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .modal-header h3 {
      margin: 0 0 0.35rem;
    }

    .modal-header p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.92rem;
    }

    .modal-body {
      display: grid;
      gap: 1.25rem;
    }

    .lot-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .lot-feedback {
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      background: rgba(220, 38, 38, 0.12);
      color: var(--danger);
      font-weight: 500;
      margin: 0;
    }

    .lot-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      background: rgba(79, 70, 229, 0.08);
      color: var(--primary-dark);
      font-weight: 600;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    @media (max-width: 1024px) {
      .actions-col {
        width: auto;
      }

      th, td {
        padding: 0.85rem 0.95rem;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn {
        flex: 1;
        justify-content: center;
      }

      .filters {
        display: grid;
        grid-template-columns: 1fr;
      }

      .actions {
        flex-wrap: wrap;
      }

      .modal-card {
        padding: 1.25rem;
      }
    }
  `]
})
export class ProductListComponent {
  search = '';
  maxUnits: number | undefined;
  pageSize = 20;
  status: 'all' | 'low' | 'healthy' = 'all';
  products = signal<Product[]>([]);
  page = signal(1);
  total = signal(0);
  report = signal<any>(null);
  lowStock = signal<Product[]>([]);
  lotTarget: Product | null = null;
  lotMode: 'add' | 'remove' = 'add';
  lotAmount: number | null = null;
  lotError = '';
  editTarget: Product | null = null;
  editModel = { name: '', category: '', purchasePrice: 0, salePrice: 0 };
  editError = '';

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));

  constructor(private productService: ProductService) {
    // apontar para sinais do service para manter reatividade
    this.products = this.productService.products;
    this.page = this.productService.page;
    this.total = this.productService.total;
    this.report = this.productService.report as any;
    this.lowStock = this.productService.lowStock;
    this.load();
    this.refreshReport();
    this.refreshAnalytics();
    effect(() => { /* react to page changes */ });
  }

  async load() {
    await this.productService.load({
      search: this.search,
      maxUnits: this.maxUnits,
      page: this.page(),
      pageSize: this.pageSize,
      status: this.status
    });
  }

  onFilterChange() {
    this.page.set(1);
    this.load();
  }

  isLowStock(p: Product) {
    return this.lowStock().some(ls => ls.id === p.id) || (this.maxUnits != null && p.quantity <= this.maxUnits);
  }

  async inc(p: Product, qty: number) {
    await this.productService.update(p.id, { quantity: p.quantity + qty });
    this.refreshReport();
    this.refreshAnalytics();
  }

  async dec(p: Product, qty: number) {
    if (p.quantity - qty < 0) return;
    await this.productService.update(p.id, { quantity: p.quantity - qty });
    this.refreshReport();
    this.refreshAnalytics();
  }

  async remove(p: Product) {
    if (!confirm('Excluir produto?')) return;
    await this.productService.delete(p.id);
    this.refreshReport();
    this.refreshAnalytics();
  }

  async refreshReport() {
    await this.productService.fetchReport();
  }

  async refreshAnalytics() {
    await this.productService.fetchAdvancedReport();
  }

  openLot(product: Product) {
    this.lotTarget = product;
    this.lotMode = 'add';
    this.lotAmount = null;
    this.lotError = '';
  }

  closeLot() {
    this.lotTarget = null;
    this.lotAmount = null;
    this.lotError = '';
  }

  setLotMode(mode: 'add' | 'remove') {
    this.lotMode = mode;
    this.lotError = '';
  }

  async applyLot() {
    if (!this.lotTarget) return;
    const amount = this.lotAmount != null ? Math.floor(this.lotAmount) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      this.lotError = 'Informe uma quantidade maior que zero.';
      return;
    }
    const delta = this.lotMode === 'add' ? amount : -amount;
    const nextQuantity = this.lotTarget.quantity + delta;
    if (nextQuantity < 0) {
      this.lotError = 'A quantidade final não pode ser negativa.';
      return;
    }
    await this.productService.update(this.lotTarget.id, { quantity: nextQuantity });
    await this.refreshReport();
    await this.refreshAnalytics();
    this.closeLot();
  }

  projectedQuantity(product: Product) {
    const amount = this.lotAmount && this.lotAmount > 0 ? Math.floor(this.lotAmount) : 0;
    if (this.lotMode === 'add') {
      return product.quantity + amount;
    }
    return Math.max(0, product.quantity - amount);
  }

  openEdit(product: Product) {
    this.editTarget = product;
    this.editModel = {
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice
    };
    this.editError = '';
  }

  closeEdit() {
    this.editTarget = null;
    this.editModel = { name: '', category: '', purchasePrice: 0, salePrice: 0 };
    this.editError = '';
  }

  async applyEdit() {
    if (!this.editTarget) return;
    const { name, category, purchasePrice, salePrice } = this.editModel;
    const parsedPurchase = Number(purchasePrice);
    const parsedSale = Number(salePrice);
    if (!name.trim() || !category.trim()) {
      this.editError = 'Preencha nome e categoria.';
      return;
    }
    if (!Number.isFinite(parsedPurchase) || !Number.isFinite(parsedSale) || parsedPurchase < 0 || parsedSale < 0) {
      this.editError = 'Valores devem ser positivos.';
      return;
    }
    await this.productService.update(this.editTarget.id, {
      name: name.trim(),
      category: category.trim(),
      purchasePrice: parsedPurchase,
      salePrice: parsedSale
    });
    await this.refreshReport();
    await this.refreshAnalytics();
    this.closeEdit();
  }

  prev() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.load();
    }
  }
  next() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.load();
    }
  }
}
