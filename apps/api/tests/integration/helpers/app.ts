import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../../src/app.js';

let _app: FastifyInstance | null = null;

export async function getApp(): Promise<FastifyInstance> {
  if (!_app) {
    _app = await buildApp({ logger: false });
    await _app.ready();
  }
  return _app;
}

export async function closeApp(): Promise<void> {
  if (_app) {
    await _app.close();
    _app = null;
  }
}
