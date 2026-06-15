// WhatsApp notification service.
//
// Renders a message template for an order and hands it to the configured WhatsApp sender.
// Everything is wrapped so a notification failure can NEVER break the order flow that
// triggered it (callers invoke these fire-and-forget). While sending is disabled the sender
// logs the rendered message and reports 'skipped'; every attempt is recorded in
// notification_log for audit.
//
// To go live, configure the whatsapp_* settings and implement a real adapter — see
// lib/whatsapp/sender.ts.
import type { FastifyInstance } from 'fastify';
import type { MessageTemplate, MessageTemplateType } from '@laundry-palu/shared';
import * as orderRepo from '../repositories/order.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import * as branchRepo from '../repositories/branch.repo.js';
import * as userRepo from '../repositories/user.repo.js';
import * as templateRepo from '../repositories/message-template.repo.js';
import * as notificationLogRepo from '../repositories/notification-log.repo.js';
import * as settingsService from './settings.service.js';
import { getSender, type WhatsAppConfig } from '../lib/whatsapp/index.js';
import {
  renderPaymentReceipt,
  renderReadyForCollection,
  normalizePhone,
  type ReceiptContext,
} from '../lib/whatsapp/render.js';

type Renderer = (template: MessageTemplate, ctx: ReceiptContext) => string;

async function dispatch(
  fastify: FastifyInstance,
  orderId: string,
  type: MessageTemplateType,
  render: Renderer
): Promise<void> {
  try {
    const template = await templateRepo.findByType(fastify.db, type);
    if (!template || !template.isActive) {
      fastify.log.info({ orderId, type }, 'WhatsApp template missing or inactive — skipping');
      return;
    }

    const order = await orderRepo.findById(fastify.db, orderId);
    if (!order) {
      fastify.log.warn({ orderId, type }, 'WhatsApp notification: order not found');
      return;
    }

    const customer = await customerRepo.findById(fastify.db, order.customerId);
    if (!customer || !customer.noHp) {
      fastify.log.info({ orderId, type }, 'WhatsApp notification: customer has no phone — skipping');
      return;
    }

    const branch = order.branchId ? await branchRepo.findById(fastify.db, order.branchId) : null;
    const settings = await settingsService.getSettings(fastify.db);
    const creator = order.createdBy ? await userRepo.findById(fastify.db, order.createdBy) : null;

    const ctx: ReceiptContext = {
      order,
      customer,
      branch,
      settings,
      ...(creator ? { creatorName: creator.nama } : {}),
    };
    const message = render(template, ctx);
    const toNumber = normalizePhone(customer.countryCode, customer.noHp);

    const config: WhatsAppConfig = {
      enabled: settings.whatsappEnabled,
      provider: settings.whatsappProvider,
      apiUrl: settings.whatsappApiUrl,
      apiKey: settings.whatsappApiKey,
      sender: settings.whatsappSender,
    };
    const sender = getSender(config, fastify.log);

    let result;
    try {
      result = await sender.send(toNumber, message);
    } catch (err: unknown) {
      const e = err as { message?: string };
      result = { status: 'failed' as const, error: e.message ?? 'send error' };
    }

    await notificationLogRepo.create(fastify.db, {
      orderId: order.id,
      type,
      toNumber,
      message,
      status: result.status,
      error: result.error ?? null,
    });
  } catch (err: unknown) {
    fastify.log.error({ err, orderId, type }, 'WhatsApp notification dispatch failed');
  }
}

export function sendPaymentReceipt(fastify: FastifyInstance, orderId: string): Promise<void> {
  return dispatch(fastify, orderId, 'payment_receipt', renderPaymentReceipt);
}

export function sendReadyForCollection(fastify: FastifyInstance, orderId: string): Promise<void> {
  return dispatch(fastify, orderId, 'ready_for_collection', renderReadyForCollection);
}
