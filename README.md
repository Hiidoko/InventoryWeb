# Inventory Intelligence (Projeto de Estudos)

Este repositorio apresenta um estudo pratico de gestao de estoque construido integralmente em TypeScript, combinando um backend Express + MongoDB com um frontend Angular 21. A ideia e explorar conceitos modernos de desenvolvimento full stack com foco em integracao de dados, UX e relatorios analiticos.

> **Aviso**: Este e um projeto educacional. Credenciais padrao, modelos de dados e regras devem ser ajustados antes de qualquer uso em ambiente real.

## Funcionalidades Principais
- Painel Angular responsivo com tema glassmorphism e filtros inteligentes.
- Cadastro, edicao e exclusao de produtos com atualizacao imediata do dashboard.
- Modal de ajuste de lotes (entrada/saida) com previsao de saldo projetado.
- Indicadores financeiros (valor total, receita e lucro potenciais) e alerta de baixo estoque.
- Relatorio avancado gerado via agregacoes MongoDB (margem por categoria, giro de estoque, projecao mensal), acessivel pela rota `/dashboard`.
- Exportacao de insights do dashboard em CSV e PDF diretamente do frontend.
- Base preparada para evolucao: dashboard grafico, exportacao e autenticacao.

## Arquitetura e Stack
- **Frontend**: Angular 21 com componentes standalone, Signals e preparo para SSR.
- **Backend**: Node.js + Express em TypeScript, camada de servicos e rotas modulares.
- **Banco de dados**: MongoDB Atlas via Mongoose 8 com schema tipado.
- **Ferramentas de apoio**: Vitest para testes, Nodemon/ts-node para DX, Angular CLI para produtividade.

## Estrutura do Repositorio
```
backend/
  src/
    config/        # Carregamento de variaveis e conexao com MongoDB
    models/        # Tipos compartilhados
    services/      # Regras de negocio (CRUD, relatorios)
    routes/        # Rotas Express organizadas por recurso
    server.ts      # Bootstrap do servidor
  package.json
  tsconfig.json
  .env.example

inventory-web/
  src/
    app/           # Componentes standalone, rotas e servicos
    styles.css     # Tema global do painel
  angular.json
  package.json

```

## Como Executar
### Requisitos
- Node.js 20 ou superior
- Instancia MongoDB (Atlas ou local) compativel com a URI configurada

### Backend
1. Copie `backend/.env.example` para `backend/.env` e ajuste as variaveis conforme necessario.
2. Instale dependencias e execute o servidor:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Servidor padrao exposto em `http://localhost:3000`.

### Frontend
1. Em outro terminal, instale e suba o Angular dev server:
   ```bash
   cd inventory-web
   npm install
   npm start
   ```
2. Interface disponivel em `http://localhost:4200`.

> O frontend consome o backend local. Ajuste `API_BASE` em `inventory-web/src/app/services/product.service.ts` se expuser a API em outro host.

## Variaveis de Ambiente (backend)
```
PORT=3000
LOW_STOCK_THRESHOLD=5
MONGO_URI=mongodb+srv://...
MONGO_DB_NAME=inventory-app
```
`MONGO_URI` e `MONGO_DB_NAME` possuem valores exemplo em `src/config/env.ts`. Substitua por credenciais seguras.

## Scripts Uteis
- **Backend**
  - `npm run dev`: servidor com Nodemon.
  - `npm run build`: compilacao TypeScript para `dist/`.
  - `npm start`: executa o build transpilado.
- **Frontend**
  - `npm start`: `ng serve` com recarregamento.
  - `npm run build`: build de producao.
  - `npm test`: executa Vitest com TestBed configurado para componentes standalone e rotas Angular.

## Dicas de Troubleshooting
- Se o editor exibir erro falso em `import { AnalyticsDashboardComponent } ...`, reinicie o servidor TypeScript ou rode `npm run build` para limpar o cache da linguagem.
- Ao criar novos testes que utilizam `RouterLink`/`RouterOutlet`, lembre-se de prover as rotas (por exemplo com `provideRouter(routes)` ou `RouterTestingModule`).

## Roteiro Sugerido de Estudo
1. **Explorar CRUD**: criar produtos, ajustar lotes e validar alertas de estoque.
2. **Analisar relatorios**: chamar `GET /reports` e `/reports/advanced` para entender agregacoes MongoDB.
3. **Customizar UI**: editar `styles.css` e componentes para praticar design system.
4. **Adicionar testes**: cobrir servicos Angular e camadas de servico backend com Vitest/Jest.
5. **Expandir features**: implementar dashboard grafico, exportacao e autenticacao conforme objetivos pessoais.

## Roadmap Futuro
- Controle de acesso com JWT e perfis por papel.
- Auditoria de movimentacoes e integracao com ERPs ficticios.

## Licenca
Projeto educacional sem licenca especifica. Utilize como referencia e adapte conforme suas necessidades.
