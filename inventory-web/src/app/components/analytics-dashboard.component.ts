import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { AdvancedReport } from '../models/product';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="dashboard-shell">
    <header class="dashboard-header">
      <div>
        <h2>Dashboard analitico</h2>
        <p>Analise o desempenho financeiro do estoque com foco em margem, giro e previsao.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn ghost" (click)="reload()">Atualizar dados</button>
        <button type="button" class="btn ghost" (click)="exportCSV()">Exportar CSV</button>
        <button type="button" class="btn primary" (click)="exportPDF()">Exportar PDF</button>
      </div>
    </header>

    <section *ngIf="loading()" class="state-block">
      <div class="state-indicator" aria-hidden="true"></div>
      <p>Carregando indicadores...</p>
    </section>

    <section *ngIf="!loading() && error()" class="state-block error">
      <p>{{ error() }}</p>
      <button type="button" class="btn ghost" (click)="reload()">Tentar novamente</button>
    </section>

    <ng-container *ngIf="!loading() && !error() && report() as data">
      <section class="metrics-grid">
        <article class="metric-card">
          <span class="metric-label">Valor de estoque</span>
          <strong class="metric-value">{{ formatCurrency(data.summary.totalValue) }}</strong>
        </article>
        <article class="metric-card focus">
          <span class="metric-label">Receita potencial</span>
          <strong class="metric-value">{{ formatCurrency(data.summary.potentialRevenue) }}</strong>
        </article>
        <article class="metric-card accent">
          <span class="metric-label">Lucro potencial</span>
          <strong class="metric-value">{{ formatCurrency(data.summary.potentialProfit) }}</strong>
        </article>
      </section>

      <section class="panel">
        <header class="panel-header">
          <div>
            <h3>Margem por categoria</h3>
            <p>Relacao entre valor em estoque e potencial de margem por categoria.</p>
          </div>
        </header>
        <div *ngIf="!marginByCategory().length" class="empty">Sem dados suficientes para exibir margens.</div>
        <ul class="category-list" *ngIf="marginByCategory().length">
          <li *ngFor="let item of marginByCategory()">
            <div class="category-head">
              <span class="badge">{{ item.category }}</span>
              <span class="totals">
                <strong>{{ formatCurrency(item.margin) }}</strong>
                <small>Margem potencial</small>
              </span>
            </div>
            <div class="bar-track">
              <div class="bar" [style.width]="categoryWidth(item)"></div>
            </div>
            <div class="category-meta">
              <span>Valor em estoque: <strong>{{ formatCurrency(item.totalValue) }}</strong></span>
              <span>Receita projetada: <strong>{{ formatCurrency(item.totalRevenue) }}</strong></span>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <header class="panel-header">
          <div>
            <h3>Giro de estoque</h3>
            <p>Itens com maior velocidade de saida e idade em dias.</p>
          </div>
        </header>
        <div *ngIf="!turnover().length" class="empty">Sem movimentacao suficiente para calcular giro.</div>
        <ul class="turnover-list" *ngIf="turnover().length">
          <li *ngFor="let item of turnover()">
            <div class="turnover-head">
              <div>
                <strong>{{ item.name }}</strong>
                <span class="sku">SKU {{ item.sku }}</span>
              </div>
              <span class="velocity">{{ formatNumber(item.velocity, 2) }} ud/dia</span>
            </div>
            <div class="turnover-bar">
              <div class="bar" [style.width]="turnoverWidth(item)"></div>
            </div>
            <div class="turnover-meta">
              <span>Categoria: {{ item.category }}</span>
              <span>Tempo em estoque: {{ item.ageDays }} dias</span>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <header class="panel-header">
          <div>
            <h3>Projecao mensal de receita</h3>
            <p>Evolucao do potencial de receita para os proximos meses.</p>
          </div>
        </header>
        <div *ngIf="!projectionSeries().length" class="empty">Cadastre produtos para gerar uma projecao.</div>
        <div class="projection" *ngIf="projectionSeries().length">
          <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" role="img" aria-label="Grafico de projecao mensal">
            <path class="area" [attr.d]="projectionAreaPath()" />
            <path class="line" [attr.d]="projectionLinePath()" />
            <g class="points">
                <circle *ngFor="let point of projectionPoints(); index as i" [attr.cx]="point.x" [attr.cy]="point.y" r="4">
                  <title>{{ formatMonthLabel(projectionSeries()[i]) }} - {{ formatCurrency(projectionSeries()[i].potentialRevenue) }}</title>
              </circle>
            </g>
          </svg>
          <div class="projection-legend">
              <div *ngFor="let item of projectionSeries()">
              <span>{{ formatMonthLabel(item) }}</span>
              <strong>{{ formatCurrency(item.potentialRevenue) }}</strong>
            </div>
          </div>
        </div>
      </section>
    </ng-container>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      color: var(--text);
    }

    .dashboard-shell {
      display: grid;
      gap: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .dashboard-header h2 {
      margin: 0 0 0.2rem 0;
      font-size: clamp(1.4rem, 3vw, 1.9rem);
    }

    .dashboard-header p {
      margin: 0;
      color: var(--text-muted);
      max-width: 540px;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
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

    .btn.primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      box-shadow: 0 12px 30px -20px rgba(79, 70, 229, 0.8);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 30px -18px rgba(15, 23, 42, 0.4);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: linear-gradient(160deg, rgba(255,255,255,0.95), rgba(244,246,255,0.95));
      padding: 1.35rem;
      border-radius: var(--radius-md);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.8);
      display: grid;
      gap: 0.35rem;
    }

    .metric-card.focus {
      background: linear-gradient(160deg, rgba(79,70,229,0.12), rgba(14,116,144,0.12), #fff);
      border-color: rgba(79, 70, 229, 0.32);
    }

    .metric-card.accent {
      background: linear-gradient(160deg, rgba(22,163,74,0.14), rgba(59,130,246,0.12), #fff);
      border-color: rgba(22,163,74,0.28);
    }

    .metric-label {
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.08rem;
      color: var(--text-muted);
    }

    .metric-value {
      font-size: clamp(1.2rem, 2.4vw, 1.7rem);
    }

    .panel {
      background: rgba(255, 255, 255, 0.93);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 18px 46px -32px rgba(15, 23, 42, 0.6);
      display: grid;
      gap: 1.25rem;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .panel-header p {
      margin: 0.25rem 0 0 0;
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .state-block {
      display: grid;
      justify-items: center;
      gap: 0.75rem;
      padding: 2rem 1rem;
      border-radius: var(--radius-md);
      background: rgba(148, 163, 184, 0.1);
      color: var(--text-muted);
    }

    .state-block.error {
      background: rgba(248, 113, 113, 0.12);
      color: var(--danger);
    }

    .state-indicator {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 3px solid rgba(79, 70, 229, 0.25);
      border-top-color: var(--primary);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-sm);
      background: rgba(148, 163, 184, 0.12);
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .category-list,
    .turnover-list {
      display: grid;
      gap: 1.15rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .category-head,
    .turnover-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(79, 70, 229, 0.12);
      color: var(--primary-dark);
      padding: 0.3rem 0.6rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .totals {
      display: grid;
      gap: 0.2rem;
      text-align: right;
      font-size: 0.95rem;
    }

    .totals strong {
      font-size: 1rem;
    }

    .totals small {
      color: var(--text-muted);
      font-weight: 500;
    }

    .bar-track {
      height: 10px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.16);
      overflow: hidden;
    }

    .bar {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(79,70,229,0.75), rgba(14,116,144,0.65));
      transition: width 0.4s ease;
    }

    .category-meta,
    .turnover-meta {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }

    .category-meta strong {
      color: var(--text);
    }

    .turnover-bar {
      height: 8px;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.16);
      overflow: hidden;
    }

    .turnover-bar .bar {
      background: linear-gradient(135deg, rgba(59,130,246,0.7), rgba(96,165,250,0.9));
    }

    .turnover-head strong {
      font-size: 1rem;
    }

    .sku {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .velocity {
      font-weight: 600;
      color: var(--primary-dark);
    }

    .projection {
      display: grid;
      gap: 1.25rem;
    }

    .projection svg {
      width: 100%;
      height: auto;
    }

    .projection .area {
      fill: rgba(79, 70, 229, 0.18);
      stroke: none;
    }

    .projection .line {
      fill: none;
      stroke: var(--primary);
      stroke-width: 2.5;
      stroke-linecap: round;
    }

    .projection .points circle {
      fill: #fff;
      stroke: var(--primary);
      stroke-width: 1.5;
    }

    .projection-legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
      font-size: 0.9rem;
    }

    .projection-legend strong {
      display: block;
      font-size: 1rem;
      color: var(--text);
    }

    @media (max-width: 768px) {
      .header-actions {
        width: 100%;
      }

      .header-actions .btn {
        flex: 1;
        justify-content: center;
      }

      .category-meta,
      .turnover-meta {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AnalyticsDashboardComponent {
  readonly chartWidth = 560;
  readonly chartHeight = 220;

  loading = signal(true);
  error = signal('');

  constructor(private productService: ProductService) {
    this.reload();
  }

  readonly report = computed(() => this.productService.advancedReport());

  readonly marginByCategory = computed(() => this.report()?.marginByCategory ?? []);
  readonly turnover = computed(() => this.report()?.turnover ?? []);
  readonly monthlyProjection = computed(() => this.report()?.monthlyProjection ?? []);
  readonly projectionSeries = computed(() => {
    const historical = [...this.monthlyProjection()].sort((a, b) => {
      if (a.year === b.year) return a.month - b.month;
      return a.year - b.year;
    });

    const summary = this.report()?.summary;
    const items: Array<{ year: number; month: number; potentialRevenue: number; totalValue: number }> = [...historical];

    const ensurePositive = (value?: number) => (value && value > 0 ? value : undefined);
    let baseRevenue = ensurePositive(historical.at(-1)?.potentialRevenue)
      ?? ensurePositive(summary?.potentialRevenue)
      ?? ensurePositive(summary?.totalValue)
      ?? 1000;
    let baseValue = ensurePositive(historical.at(-1)?.totalValue)
      ?? ensurePositive(summary?.totalValue)
      ?? ensurePositive(summary?.potentialRevenue)
      ?? 600;

    const minPoints = 6;
    const growthStep = 0.08;
    const valueGrowthStep = 0.04;
    const startDate = historical.length
      ? new Date(historical.at(-1)!.year, historical.at(-1)!.month - 1, 1)
      : new Date();

    let cursorDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (items.length < minPoints) {
      cursorDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1);
      const factorIndex = items.length - historical.length + 1;
      items.push({
        year: cursorDate.getFullYear(),
        month: cursorDate.getMonth() + 1,
        potentialRevenue: Math.round(baseRevenue * (1 + growthStep * factorIndex)),
        totalValue: Math.round(baseValue * (1 + valueGrowthStep * factorIndex))
      });
    }

    return items.slice(-12);
  });

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly maxCategoryMargin = computed(() => {
    const items = this.marginByCategory();
    if (!items.length) return 0;
    return Math.max(...items.map(item => Math.abs(item.margin)));
  });

  private readonly maxVelocity = computed(() => {
    const items = this.turnover();
    if (!items.length) return 0;
    return Math.max(...items.map(item => item.velocity));
  });

  private readonly projectionCoords = computed(() => {
    const data = this.projectionSeries();
    if (!data.length) return [] as Array<{ x: number; y: number }>;
    const width = this.chartWidth;
    const height = this.chartHeight;
    const maxRevenue = Math.max(...data.map(item => item.potentialRevenue));
    const safeMax = maxRevenue > 0 ? maxRevenue : 1;
    const step = data.length === 1 ? 0 : width / (data.length - 1);
    return data.map((item, index) => {
      const x = data.length === 1 ? Math.round(width / 2) : Math.round(index * step);
      const y = Math.round(height - (item.potentialRevenue / safeMax) * height);
      return { x, y };
    });
  });

  async reload() {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.productService.fetchAdvancedReport();
    } catch (error) {
      console.error('Failed to load advanced report', error);
      this.error.set('Nao foi possivel carregar o relatorio avancado.');
    } finally {
      this.loading.set(false);
    }
  }

  formatCurrency(value: number) {
    return this.currencyFormatter.format(value ?? 0);
  }

  formatCurrencyPlain(value: number) {
    const formatted = this.currencyFormatter.format(value ?? 0);
    return formatted.replace(/[^0-9.,-]/g, '').trim();
  }

  formatNumber(value: number, digits = 2) {
    const formatter = new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    });
    return formatter.format(value ?? 0);
  }

  categoryWidth(item: AdvancedReport['marginByCategory'][number]) {
    const max = this.maxCategoryMargin();
    if (!max) return '0%';
    const ratio = Math.min(Math.abs(item.margin) / max, 1);
    return `${Math.round(ratio * 100)}%`;
  }

  turnoverWidth(item: AdvancedReport['turnover'][number]) {
    const max = this.maxVelocity();
    if (!max) return '0%';
    const ratio = Math.min(item.velocity / max, 1);
    return `${Math.round(ratio * 100)}%`;
  }

  projectionPoints() {
    return this.projectionCoords();
  }

  projectionLinePath() {
    const coords = this.projectionCoords();
    if (!coords.length) return '';
    if (coords.length === 1) {
      const y = coords[0].y;
      return `M 0 ${y} L ${this.chartWidth} ${y}`;
    }
    return coords
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  }

  projectionAreaPath() {
    const coords = this.projectionCoords();
    if (!coords.length) return '';
    const height = this.chartHeight;
    if (coords.length === 1) {
      const y = coords[0].y;
      return `M 0 ${height} L 0 ${y} L ${this.chartWidth} ${y} L ${this.chartWidth} ${height} Z`;
    }
    let path = `M 0 ${height}`;
    coords.forEach(point => {
      path += ` L ${point.x} ${point.y}`;
    });
    const last = coords[coords.length - 1];
    path += ` L ${last.x} ${height} Z`;
    return path;
  }

  formatMonthLabel(item: AdvancedReport['monthlyProjection'][number]) {
    const date = new Date(item.year, item.month - 1, 1);
    return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
  }

  exportCSV() {
    const data = this.report();
    if (!data) return;

    const escape = (value: string) => {
      if (/[",;\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const formatRow = (columns: (string | number)[]) => columns.map(col => escape(String(col))).join(';');
    const newline = '\r\n';
    const rows: string[] = [];

    const addSectionTitle = (title: string) => {
      if (rows.length) rows.push(newline);
      rows.push(title);
    };

    const addRows = (entries: string[]) => {
      rows.push(...entries);
    };

    addSectionTitle('Resumo financeiro');
    addRows([
      formatRow(['Indicador', 'Valor']),
      formatRow(['Valor de estoque', this.formatCurrencyPlain(data.summary.totalValue)]),
      formatRow(['Receita potencial', this.formatCurrencyPlain(data.summary.potentialRevenue)]),
      formatRow(['Lucro potencial', this.formatCurrencyPlain(data.summary.potentialProfit)])
    ]);

    addSectionTitle('Margem por categoria');
    const marginRows = [formatRow(['Categoria', 'Valor em estoque', 'Receita potencial', 'Lucro potencial'])];
    data.marginByCategory.forEach(item => {
      marginRows.push(formatRow([
        item.category,
        this.formatCurrencyPlain(item.totalValue),
        this.formatCurrencyPlain(item.totalRevenue),
        this.formatCurrencyPlain(item.margin)
      ]));
    });
    addRows(marginRows);

    addSectionTitle('Giro de estoque');
    const turnoverRows = [formatRow(['Produto', 'SKU', 'Categoria', 'Velocidade (ud/dia)', 'Idade (dias)'])];
    data.turnover.forEach(item => {
      turnoverRows.push(formatRow([
        item.name,
        item.sku,
        item.category,
        this.formatNumber(item.velocity, 2),
        item.ageDays
      ]));
    });
    addRows(turnoverRows);

    addSectionTitle('Projecao mensal');
    const projection = this.projectionSeries();
    const projectionRows = [formatRow(['Mes', 'Receita potencial', 'Valor em estoque'])];
    projection.forEach(item => {
      projectionRows.push(formatRow([
        this.formatMonthLabel(item),
        this.formatCurrencyPlain(item.potentialRevenue),
        this.formatCurrencyPlain(item.totalValue)
      ]));
    });
    addRows(projectionRows);

    const csvContent = rows.join(newline);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard-estoque-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportPDF() {
    const data = this.report();
    if (!data) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let cursorY = 20;

    doc.setFontSize(18);
    doc.text('Dashboard de Estoque', 14, cursorY);
    cursorY += 10;

    doc.setFontSize(12);
    doc.text('Resumo financeiro', 14, cursorY);
    cursorY += 6;
    doc.text(`Valor de estoque: ${this.formatCurrency(data.summary.totalValue)}`, 14, cursorY);
    cursorY += 6;
    doc.text(`Receita potencial: ${this.formatCurrency(data.summary.potentialRevenue)}`, 14, cursorY);
    cursorY += 6;
    doc.text(`Lucro potencial: ${this.formatCurrency(data.summary.potentialProfit)}`, 14, cursorY);
    cursorY += 10;

    doc.text('Margem por categoria', 14, cursorY);
    cursorY += 6;
    data.marginByCategory.forEach(item => {
      doc.text(`- ${item.category}: ${this.formatCurrency(item.margin)} (estoque ${this.formatCurrency(item.totalValue)})`, 14, cursorY);
      cursorY += 6;
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }
    });
    cursorY += 4;

    doc.text('Giro de estoque', 14, cursorY);
    cursorY += 6;
    data.turnover.forEach(item => {
      doc.text(`- ${item.name} | ${item.sku} | ${this.formatNumber(item.velocity, 2)} ud/dia | ${item.ageDays} dias`, 14, cursorY);
      cursorY += 6;
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }
    });
    cursorY += 4;

    doc.text('Projecao mensal', 14, cursorY);
    cursorY += 6;
    const projection = this.projectionSeries();
    projection.forEach(item => {
      doc.text(`- ${this.formatMonthLabel(item)}: ${this.formatCurrency(item.potentialRevenue)}`, 14, cursorY);
      cursorY += 6;
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }
    });

    const filename = `dashboard-estoque-${new Date().toISOString().substring(0, 10)}.pdf`;
    doc.save(filename);
  }
}
