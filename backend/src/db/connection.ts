import mongoose from 'mongoose';
import { config } from '../config/env';

let connectPromise: Promise<typeof mongoose> | null = null;

export function connectToDatabase() {
  if (connectPromise) {
    return connectPromise;
  }

  mongoose.set('strictQuery', true);

  connectPromise = mongoose
    .connect(config.mongoUri, {
      dbName: config.mongoDbName,
      autoIndex: true
    })
    .then(connection => {
      const uriSafe = config.mongoUri.replace(/:\/\/.+@/, '://****:****@');
      console.log(`MongoDB conectado em ${uriSafe}`);
      connection.connection.on('disconnected', () => {
        console.warn('MongoDB desconectado');
      });
      return connection;
    })
    .catch(err => {
      connectPromise = null;
      console.error('Erro ao conectar no MongoDB', err);
      throw err;
    });

  return connectPromise;
}
