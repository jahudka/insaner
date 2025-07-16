# CORS plugin for the Insaner HTTP server

This plugin allows you to handle CORS in Insaner.

Installation:

```shell
npm install --save @insaner/cors
```

Usage:

```typescript
import { HttpServer } from 'insaner';
import { Cors } from '@insaner/cors';

const server = new HttpServer();
const cors = new Cors({
  route: /^/, // which URLs should be handled; defaults to all URLs
  origin: true,
  headers: true,
  methods: true,
  credentials: true, // allow credentials; defaults to false
  maxAge: 100, // how long should browsers cache preflight results
});

cors.install(server);

// shorthand:
Cors.install(server, { ...options });
```

The `origin`, `headers`, and `methods` options can be specified in a couple of
ways:
 - Not specifying an option (or setting it to `undefined`) means that the
   corresponding `Access-Control-Allow-*` response header will never be sent.
 - `true` will make the handler echo the corresponding request value back to the
   client, e.g. a request with `Origin: https://example.com` will receive a
   response with `Access-Control-Allow-Origin: https://example.com`.
 - A string or an array of strings will make the handler always respond with the
   specified value; an array will be concatenated as appropriate. The `origin`
   option behaves slightly differently: the value is always converted to an array
   and the handler will respond back with the request origin if the origin is
   found in the array.
 - A regular expression will make the handler echo the values specified in the
   corresponding request headers filtered to only contain items matching the
   regular expression. For example, with `methods: /^(get|post)$/`, a pre-flight
   request with `Access-Control-Request-Method: POST` will result in a
   `Access-Control-Allow-Methods: POST` response header.
