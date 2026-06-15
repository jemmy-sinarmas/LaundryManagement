import type { WhatsAppConfig, WhatsAppSender } from './sender.js';
import { LogAdapter, type SimpleLogger } from './adapters/log.adapter.js';
import { HttpAdapter } from './adapters/http.adapter.js';

export type { WhatsAppConfig, WhatsAppSender, SendResult, SendStatus } from './sender.js';

// Selects the sender adapter for the current configuration. When sending is disabled the
// log adapter is used (records the rendered message, returns 'skipped').
export function getSender(config: WhatsAppConfig, logger: SimpleLogger): WhatsAppSender {
  if (config.enabled) {
    return new HttpAdapter(config, logger);
  }
  return new LogAdapter(logger);
}
