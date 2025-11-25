import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-app',
  mongoDbName: process.env.MONGO_DB_NAME || 'inventory-app'
};
