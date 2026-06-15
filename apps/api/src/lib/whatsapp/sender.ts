// Provider-agnostic WhatsApp sender.
//
// To plug in a real provider later:
//   1. Implement WhatsAppSender in a new adapter under ./adapters (see http.adapter.ts for
//      the expected request shape — Fonnte/Wablas/Watzap/Meta all map onto send(to, message)).
//   2. Return it from getSender() in ./index.ts when config.enabled is true.
// While disabled (the default), getSender returns the log adapter which records the rendered
// message and returns { status: 'skipped' } — so the whole flow is testable without credentials.

export type SendStatus = 'sent' | 'skipped' | 'failed';

export interface SendResult {
  status: SendStatus;
  error?: string;
}

export interface WhatsAppSender {
  send(to: string, message: string): Promise<SendResult>;
}

export interface WhatsAppConfig {
  enabled: boolean;
  provider: string;
  apiUrl: string;
  apiKey: string;
  sender: string;
}
