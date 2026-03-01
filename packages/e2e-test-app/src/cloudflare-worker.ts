import { createSharedApp } from './shared-routes';

// Create shared application instance
const app = createSharedApp();

// Cloudflare Workers-specific configuration can be added here
// e.g. CORS, additional middleware, etc.

// Default export for Cloudflare Workers
export default app; 