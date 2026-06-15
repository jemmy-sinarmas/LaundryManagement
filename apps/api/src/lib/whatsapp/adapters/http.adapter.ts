import type { WhatsAppConfig, WhatsAppSender, SendResult } from '../sender.js';
import type { SimpleLogger } from './log.adapter.js';

// SCAFFOLD STUB — not wired to any live provider yet.
//
// This shows the shape of a future unofficial-gateway call (Fonnte / Wablas / Watzap style),
// where a free-form text body is POSTed to a single endpoint. Swap the body/headers to match
// the chosen provider, then enable it via getSender() once credentials are configured.
//
// It deliberately does NOT perform a real fetch yet: until a provider is chosen it returns
// 'skipped' so enabling the flag in a non-production environment is safe.
export class HttpAdapter implements WhatsAppSender {
  constructor(
    private readonly config: WhatsAppConfig,
    private readonly logger: SimpleLogger
  ) {}

  async send(to: string, message: string): Promise<SendResult> {
    // Example of the intended request (left commented until a provider is selected):
    //
    //   const res = await fetch(this.config.apiUrl, {
    //     method: 'POST',
    //     headers: { Authorization: this.config.apiKey, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ target: to, message, sender: this.config.sender }),
    //   });
    //   if (!res.ok) return { status: 'failed', error: `HTTP ${res.status}` };
    //   return { status: 'sent' };

    this.logger.info(
      { to, provider: this.config.provider, apiUrl: this.config.apiUrl, message },
      'WhatsApp HTTP adapter is a stub — no live provider wired yet'
    );
    return { status: 'skipped' };
  }
}
