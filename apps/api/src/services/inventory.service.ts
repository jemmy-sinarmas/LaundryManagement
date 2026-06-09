import { randomUUID } from 'node:crypto';
import type { InventoryItem, InventoryTransaction } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as inventoryRepo from '../repositories/inventory.repo.js';
import { calculateFifoAverage } from '../utils/fifo.js';
import type {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  BulkPurchaseInput,
} from '../schemas/inventory.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function createInventoryItem(
  db: SqlDb,
  data: CreateInventoryItemInput
): Promise<InventoryItem> {
  return inventoryRepo.create(db, { id: randomUUID(), ...data });
}

export async function getInventoryItem(db: SqlDb, id: string): Promise<InventoryItem> {
  const item = await inventoryRepo.findById(db, id);
  if (!item) throw makeError('Inventory item not found', 404);
  return item;
}

export async function listInventoryItems(
  db: SqlDb,
  options: { includeInactive?: boolean; branchId?: string | null } = {}
): Promise<InventoryItem[]> {
  return inventoryRepo.findAll(db, options);
}

export async function updateInventoryItem(
  db: SqlDb,
  id: string,
  data: UpdateInventoryItemInput
): Promise<InventoryItem> {
  const item = await inventoryRepo.update(db, id, data);
  if (!item) throw makeError('Inventory item not found', 404);
  return item;
}

export async function getLowStockItems(db: SqlDb, branchId?: string | null): Promise<InventoryItem[]> {
  return inventoryRepo.findLowStock(db, branchId);
}

export async function recordPurchase(
  db: SqlDb,
  itemId: string,
  qty: number,
  hargaPerUnit: number,
  referensi: string | null,
  createdBy: string | null,
  fotoReferensi?: string | null
): Promise<InventoryTransaction> {
  const item = await inventoryRepo.findById(db, itemId);
  if (!item) throw makeError('Inventory item not found', 404);

  const newFifo = calculateFifoAverage(item.qtySaatIni, item.hargaRataFifo, qty, hargaPerUnit);
  const newQty = item.qtySaatIni + qty;

  await inventoryRepo.updateQtyAndFifo(db, itemId, newQty, newFifo);

  return inventoryRepo.createTransaction(db, {
    id: randomUUID(),
    itemId,
    tipe: 'masuk',
    qty,
    hargaPerUnit,
    referensi,
    fotoReferensi: fotoReferensi ?? null,
    createdBy,
  });
}

export async function bulkPurchase(
  db: SqlDb,
  data: BulkPurchaseInput,
  createdBy: string | null
): Promise<InventoryTransaction[]> {
  return db.begin(async (tx) => {
    const results: InventoryTransaction[] = [];
    for (const item of data.items) {
      const tx_ = await recordPurchase(
        tx,
        item.itemId,
        item.qty,
        item.hargaPerUnit,
        item.referensi ?? null,
        createdBy,
        data.fotoReferensi ?? null
      );
      results.push(tx_);
    }
    return results;
  });
}

export async function recordUsage(
  db: SqlDb,
  itemId: string,
  qty: number,
  referensi: string | null,
  createdBy: string | null
): Promise<InventoryTransaction> {
  const item = await inventoryRepo.findById(db, itemId);
  if (!item) throw makeError('Inventory item not found', 404);

  if (item.qtySaatIni < qty) {
    throw makeError('Stok tidak cukup', 400);
  }

  const newQty = item.qtySaatIni - qty;
  await inventoryRepo.updateQtyAndFifo(db, itemId, newQty, item.hargaRataFifo);

  return inventoryRepo.createTransaction(db, {
    id: randomUUID(),
    itemId,
    tipe: 'keluar',
    qty,
    hargaPerUnit: null,
    referensi,
    createdBy,
  });
}

export async function getTransactionHistory(
  db: SqlDb,
  itemId: string
): Promise<InventoryTransaction[]> {
  return inventoryRepo.findTransactionsByItemId(db, itemId);
}
