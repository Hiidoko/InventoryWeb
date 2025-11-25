import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="form-shell">
      <header class="form-header">
        <div>
          <h2>Cadastrar novo produto</h2>
          <p>Preencha os campos para disponibilizar o item na vitrine do estoque inteligente.</p>
        </div>
        <div class="header-metric">
          <span class="metric-label">Status</span>
          <span class="metric-pill">Em criação</span>
        </div>
      </header>

      <form (ngSubmit)="submit()" #f="ngForm" class="form-panel">
        <div class="form-grid">
          <label class="field">
            <span>Nome do produto</span>
            <input name="name" [(ngModel)]="model.name" required placeholder="Ex.: Teclado Mecânico" />
          </label>

          <label class="field compact">
            <span>Código (SKU)</span>
            <input name="sku" [(ngModel)]="model.sku" required placeholder="Ex.: TEC-1234" />
          </label>

          <label class="field">
            <span>Categoria</span>
            <input name="category" [(ngModel)]="model.category" required placeholder="Ex.: Periféricos" />
          </label>

          <label class="field">
            <span>Preço de compra</span>
            <input type="number" name="purchasePrice" [(ngModel)]="model.purchasePrice" required min="0" step="0.01" placeholder="R$" />
          </label>

          <label class="field">
            <span>Preço de venda</span>
            <input type="number" name="salePrice" [(ngModel)]="model.salePrice" required min="0" step="0.01" placeholder="R$" />
          </label>

          <label class="field compact">
            <span>Quantidade inicial</span>
            <input type="number" name="quantity" [(ngModel)]="model.quantity" required min="0" placeholder="0" />
          </label>
        </div>

        <div class="callout">
          <div class="callout-content">
            <span class="callout-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9 9a3 3 0 1 1 6 0c0 1.657-1 2.5-2 3.5-.5.5-1 1-1 1.5" stroke-linecap="round"></path>
                <path d="M12 18h.01"></path>
                <path d="M12 21v-2"></path>
                <path d="M6 21h12" stroke-linecap="round"></path>
              </svg>
            </span>
            <p>
              Dica: mantenha a diferença entre venda e compra sempre positiva para preservar sua margem.
            </p>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="btn primary" [disabled]="f.invalid">Salvar produto</button>
          <button type="button" class="btn ghost" routerLink="/">Cancelar</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      color: var(--text);
    }

    .form-shell {
      display: grid;
      gap: 1.5rem;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .form-header h2 {
      font-size: clamp(1.35rem, 3vw, 1.8rem);
      margin-bottom: 0.35rem;
    }

    .form-header p {
      margin: 0;
      color: var(--text-muted);
      max-width: 520px;
    }

    .header-metric {
      background: rgba(79, 70, 229, 0.12);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      display: grid;
      gap: 0.45rem;
      align-items: center;
      min-width: 180px;
      border: 1px solid rgba(79, 70, 229, 0.2);
    }

    .metric-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06rem;
      color: var(--text-muted);
    }

    .metric-pill {
      display: inline-block;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      text-align: center;
    }

    .form-panel {
      background: rgba(255, 255, 255, 0.94);
      border-radius: var(--radius-md);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 22px 45px -30px rgba(15, 23, 42, 0.7);
      padding: clamp(1.5rem, 3vw, 2.5rem);
      display: grid;
      gap: 1.5rem;
    }

    .form-grid {
      display: grid;
      gap: 1.15rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .field {
      display: grid;
      gap: 0.45rem;
    }

    .field.compact {
      max-width: 220px;
    }

    .field span {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05rem;
      color: var(--text-muted);
    }

    input {
      padding: 0.75rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: rgba(248, 250, 252, 0.95);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      font-size: 0.95rem;
    }

    input:focus {
      border-color: rgba(79, 70, 229, 0.45);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
    }

    .callout {
      padding: 1rem 1.2rem;
      border-radius: var(--radius-sm);
      border: 1px dashed rgba(79, 70, 229, 0.35);
      background: rgba(79, 70, 229, 0.08);
      color: var(--primary-dark);
      font-size: 0.9rem;
    }

    .callout-content {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .callout-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-dark);
    }

    .callout-icon svg {
      display: block;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn {
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.7rem 1.2rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn.primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      box-shadow: 0 18px 35px -22px rgba(79, 70, 229, 0.8);
    }

    .btn.primary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn.ghost {
      background: rgba(148, 163, 184, 0.16);
      color: var(--text);
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.28);
    }

    .btn:not(:disabled):hover {
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .form-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class ProductFormComponent {
  model = { name: '', sku: '', category: '', purchasePrice: 0, salePrice: 0, quantity: 0 };
  constructor(private productService: ProductService, private router: Router) {}

  async submit() {
    await this.productService.create({ ...this.model });
    this.router.navigate(['/']);
  }
}
