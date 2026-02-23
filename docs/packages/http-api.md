# @ringai/http-api

> **DEPRECATED:** This package has been removed in v0.8.0 (Phase 2.3 of the refactor). Use the native `fetch` API instead. This documentation is retained for historical reference only.

The `http-api` package previously provided HTTP request capabilities for API testing within the ringai framework. With Node.js 22+ providing a stable global `fetch` API, this package is no longer needed.

## Migration

If you previously depended on `@ringai/http-api`:

```javascript
// Before (removed)
import { HttpAPI } from '@ringai/http-api';
const api = new HttpAPI();
const response = await api.get('https://api.example.com/data');

// After — use native fetch
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

For advanced HTTP testing needs (interceptors, retry, etc.), consider libraries like `ky` or `ofetch`.
