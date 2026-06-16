import { buildApp } from './app.js';

const app = await buildApp({ logger: true });
const PORT = Number(process.env['PORT'] ?? 4000);
await app.listen({ port: PORT, host: '0.0.0.0' });
