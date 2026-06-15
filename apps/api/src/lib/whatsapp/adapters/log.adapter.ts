import type { WhatsAppSender, SendResult } from '../sender.js';

export interface SimpleLogger {
  info(obj: object, msg?: string): void;
}

// Default adapter used while WhatsApp sending is disabled. Logs the fully-rendered message
// instead of making a live HTTP call, and reports it as "skipped".
export class LogAdapter implements WhatsAppSender {
  constructor(private readonly logger: SimpleLogger) {}

  async send(to: string, message: string): Promise<SendResult> {
    this.logger.info({ to, message }, 'WhatsApp disabled — would send');
    return { status: 'skipped' };
  }
}
