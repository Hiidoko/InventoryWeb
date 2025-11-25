# Inventory Tracker (Frontend)

Aplicação Angular para o Sistema de Gestão de Estoque simples. Interface permite:
* Listar produtos com filtros (busca, limite de unidades) e paginação.
* Destacar produtos com baixo estoque.
* Cadastrar, atualizar quantidade (+/-1) e excluir produtos.
* Visualizar relatório de valor total do estoque, receita e lucro potencial.

Backend em Node/Express roda em `http://localhost:3000`.

## Servidor de desenvolvimento (Frontend)

```bash
cd inventory-web
npm install
ng serve
```
Abrir `http://localhost:4200/`.

## Servidor Backend

```bash
cd backend
npm install
npm run dev
```
Variáveis de ambiente opcionais em `.env`:
```
PORT=3000
LOW_STOCK_THRESHOLD=5
```

## Endpoints Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | / | Health check |
| GET | /products | Lista produtos (sem filtros) ou objeto paginado se query usada |
| GET | /products?search=abc&maxUnits=10&page=1&pageSize=20 | Filtros/paginação |
| GET | /products/low-stock | Lista de baixo estoque (<= limite) |
| GET | /products/:id | Detalhe |
| POST | /products | Cria produto { name, sku, purchasePrice, salePrice, quantity } |
| PUT | /products/:id | Atualiza campos parciais |
| DELETE | /products/:id | Remove produto |
| GET | /reports | { totalValue, potentialRevenue, potentialProfit, lowStock[] } |

## Modelo de Produto
```
{
	id: string,
	name: string,
	sku: string,
	purchasePrice: number,
	salePrice: number,
	quantity: number,
	createdAt: string,
	updatedAt: string
}
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Build Produção Frontend

```bash
ng build
```
Artefatos em `dist/`. Pode ser servido por qualquer servidor estático.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Próximos Passos / Ideias
* Persistência em banco (SQLite / Postgres).
* Autenticação simples para multiusuário.
* Exportar relatório em CSV / PDF.
* Histórico de movimentação de estoque.

## Recursos Adicionais
Referências CLI Angular: https://angular.dev/tools/cli
