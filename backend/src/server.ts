import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { InventoryService } from './services/InventoryService';
import { productsRouter } from './routes/products';
import { reportsRouter } from './routes/reports';
import { connectToDatabase } from './db/connection';

const app = express();
app.use(cors());
app.use(express.json());

const inventory = new InventoryService(config.lowStockThreshold);

app.get('/', (_req, res) => {
  res.json({ message: 'Inventory API OK' });
});

app.use('/products', productsRouter(inventory));
app.use('/reports', reportsRouter(inventory));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno' });
});

async function bootstrap() {
  try {
    await connectToDatabase();
    app.listen(config.port, () => {
      console.log(`Servidor iniciado na porta ${config.port}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar servidor', error);
    process.exit(1);
  }
}

bootstrap();
