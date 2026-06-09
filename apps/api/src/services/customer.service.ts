import { randomUUID } from 'node:crypto';
import type { Customer } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as customerRepo from '../repositories/customer.repo.js';
import type { CreateCustomerInput, UpdateCustomerInput } from '../schemas/customer.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listCustomers(db: SqlDb, search?: string): Promise<Customer[]> {
  return customerRepo.findAll(db, search);
}

export async function getCustomer(db: SqlDb, id: string): Promise<Customer> {
  const customer = await customerRepo.findById(db, id);
  if (!customer) throw makeError('Customer not found', 404);
  return customer;
}

export async function createCustomer(db: SqlDb, data: CreateCustomerInput): Promise<Customer> {
  const existing = await customerRepo.findByNoHp(db, data.noHp);
  if (existing) throw makeError('Nomor HP sudah terdaftar', 409);
  return customerRepo.create(db, {
    id: randomUUID(),
    nama: data.nama,
    alamat: data.alamat ?? null,
    noHp: data.noHp,
    countryCode: data.countryCode ?? '+62',
  });
}

export async function updateCustomer(
  db: SqlDb,
  id: string,
  data: UpdateCustomerInput
): Promise<Customer> {
  const customer = await customerRepo.update(db, id, data);
  if (!customer) throw makeError('Customer not found', 404);
  return customer;
}
