# Static file handler for Insaner

This plugin allows you to easily handle static files in Insaner.
It supports GET and HEAD requests, and also (partially) supports
the `Range: bytes=..-..` HTTP header.

Installation:

```shell
npm install --save @insaner/static
```

Usage:

```typescript
import { HttpServer } from 'insaner';
import { StaticHandler, StaticRoute } from '@insaner/static';
import { resolve } from 'path';

const server = new Server();

server.router.add(new StaticRoute('/images'), new StaticHandler(resolve(__dirname, '../static/images')));
```

The optional second argument to the `StaticHandler` constructor is an array of
index files to try when the request URI points to a directory.
