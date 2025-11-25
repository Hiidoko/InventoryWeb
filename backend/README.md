# Inventory Tracker (Backend)

API REST simples para gestão de estoque.

## Stack
- Node.js + Express
- TypeScript
- In-memory storage (array) – substituir por DB futuramente

## Instalação e Execução
```bash
cd backend
npm install
npm run dev
```
Servidor padrão: `http://localhost:3000`

Variáveis de ambiente (`.env`):
```
PORT=3000
LOW_STOCK_THRESHOLD=5
```

## Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | / | Health check |
| GET | /products | Lista todos (sem filtros) ou objeto paginado se query aplicada |
| GET | /products?search=abc&maxUnits=10&page=1&pageSize=20 | Filtro/paginação |
| GET | /products/low-stock | Produtos com quantidade <= limite configurado |
| GET | /products/:id | Detalhes de um produto |
| POST | /products | Cria produto { name, sku, purchasePrice, salePrice, quantity } |
| PUT | /products/:id | Atualiza campos parciais |
| DELETE | /products/:id | Remove produto |
| GET | /reports | Relatório agregado { totalValue, potentialRevenue, potentialProfit, lowStock[] } |

## Modelo
```
interface Product {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Lógica de Relatório
- Valor total: soma de purchasePrice * quantity
- Receita potencial: soma de salePrice * quantity
- Lucro potencial: receita potencial - valor total
- lowStock: produtos com quantity <= LOW_STOCK_THRESHOLD

## Próximas Melhorias
- Persistência (SQLite/Postgres)
- Movimentações (entrada/saída) auditadas
- Autenticação/JWT
- Testes automatizados
- Exportação de dados (CSV/PDF)

## Scripts
- `npm run dev` – desenvolvimento com nodemon
- `npm run build` – compila TypeScript para `dist/`
- `npm start` – executa build compilado
