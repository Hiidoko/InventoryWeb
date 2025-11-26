import { Router, Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/InventoryService';
import { validateProductInput, ProductCreateDTO } from '../models/Product';

const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };

const isDuplicateKeyError = (error: any) => Boolean(error?.code === 11000);

export function productsRouter(inventory: InventoryService) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const { search, maxUnits, page, pageSize, status } = req.query;
    const statusValue = typeof status === 'string' && ['low', 'healthy', 'all'].includes(status)
      ? (status as 'low' | 'healthy' | 'all')
      : undefined;
    if (!search && !maxUnits && !page && !pageSize && !statusValue) {
      const products = await inventory.list();
      res.json(products);
      return;
    }
    const parsed = await inventory.listFiltered({
      search: typeof search === 'string' ? search : undefined,
      maxUnits: typeof maxUnits === 'string' ? Number(maxUnits) : undefined,
      page: typeof page === 'string' ? Number(page) : undefined,
      pageSize: typeof pageSize === 'string' ? Number(pageSize) : undefined,
      status: statusValue
    });
    res.json(parsed);
  }));

  router.get('/low-stock', asyncHandler(async (_req, res) => {
    const items = await inventory.lowStock();
    res.json(items);
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const p = await inventory.get(req.params.id);
    if (!p) {
      res.status(404).json({ message: 'Produto não encontrado' });
      return;
    }
    res.json(p);
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const errors = validateProductInput(req.body as ProductCreateDTO);
    if (errors.length) {
      res.status(400).json({ errors });
      return;
    }
    try {
      const created = await inventory.create(req.body as ProductCreateDTO);
      res.status(201).json(created);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ message: 'Já existe um produto com este SKU.' });
        return;
      }
      throw error;
    }
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    try {
      const updated = await inventory.update(req.params.id, req.body as Partial<ProductCreateDTO>);
      if (!updated) {
        res.status(404).json({ message: 'Produto não encontrado' });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ message: 'Já existe um produto com este SKU.' });
        return;
      }
      throw error;
    }
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const ok = await inventory.delete(req.params.id);
    if (!ok) {
      res.status(404).json({ message: 'Produto não encontrado' });
      return;
    }
    res.status(204).send();
  }));

  return router;
}
