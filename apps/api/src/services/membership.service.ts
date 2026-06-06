import { randomUUID } from 'node:crypto';
import type { Membership, MembershipValidationResult } from '@laundry-palu/shared';
import { PERIODIK_DISCOUNT_PERCENT, PAKET_KG_LOW_BALANCE_THRESHOLD } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as membershipRepo from '../repositories/membership.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import type { CreateMembershipInput } from '../schemas/membership.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function validateMembership(
  membership: Membership | null,
  today = new Date().toISOString().slice(0, 10)
): MembershipValidationResult {
  if (!membership || !membership.isActive) {
    return { membership: null, discountPercent: 0, warning: null };
  }

  if (membership.tipe === 'periodik') {
    const expired = membership.tanggalSelesai < today;
    return expired
      ? { membership, discountPercent: 0, warning: 'Membership periodik telah kadaluarsa' }
      : { membership, discountPercent: PERIODIK_DISCOUNT_PERCENT, warning: null };
  }

  const lowBalance = membership.sisaKg < PAKET_KG_LOW_BALANCE_THRESHOLD;
  return {
    membership,
    discountPercent: 0,
    warning: lowBalance ? 'Sisa kg hampir habis' : null,
  };
}

export async function getMembershipForCustomer(
  db: SqlDb,
  customerId: string
): Promise<Membership | null> {
  return membershipRepo.findByCustomerId(db, customerId);
}

export async function createMembership(
  db: SqlDb,
  customerId: string,
  data: CreateMembershipInput
): Promise<Membership> {
  const customer = await customerRepo.findById(db, customerId);
  if (!customer) throw makeError('Customer not found', 404);

  const existing = await membershipRepo.findByCustomerId(db, customerId);
  if (existing) {
    await membershipRepo.deactivate(db, existing.id);
  }

  if (data.tipe === 'periodik') {
    return membershipRepo.create(db, {
      id: randomUUID(),
      customerId,
      tipe: 'periodik',
      durasibulan: data.durasibulan,
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: addMonths(data.tanggalMulai, data.durasibulan),
      paketKg: null,
      sisaKg: null,
    });
  }

  return membershipRepo.create(db, {
    id: randomUUID(),
    customerId,
    tipe: 'paket_kg',
    durasibulan: null,
    tanggalMulai: null,
    tanggalSelesai: null,
    paketKg: data.paketKg,
    sisaKg: data.paketKg,
  });
}

export async function validateCustomerMembership(
  db: SqlDb,
  customerId: string
): Promise<MembershipValidationResult> {
  const membership = await getMembershipForCustomer(db, customerId);
  return validateMembership(membership);
}
