# Insaner - Decidedly Opinionated Minimal NodeJS Http Server

This package is an opinionated HTTP server built on top of
the native NodeJS HTTP server.

 - No callbacks! Pure Promise bliss.
 - There is a simple regexp-based router.
 - Response object is _not_ passed into request handlers,
   instead request handlers are expected to _return_
   a Response object.
 - Request body consumption and parsing is done on-demand
   similarly to the `fetch` Response, ie. `await req.text()`
   and `await req.json()`; consumed raw body is cached, so
   multiple calls to `req.text()` and `req.json()` are possible
   (JSON parsing is done each time you call `req.json()` so that
   you can be sure you get the unmodified data, no matter what
   your middlewares do).
 - While we're at that... **no middlewares**. The HTTP server
   emits a `request` event which you can listen to, and the
   implementation will even handle async listeners for that event,
   so you can hook into request handling before the router is called,
   but that's it.
 - Also, cookies work out of the box.
 - WebSocket compatible.
 - Typings included.

## Installation

```shell
npm install --save insaner
```

## Usage

```typescript
import { HttpServer, HttpRequest, HttpForbiddenError } from 'insaner';

const server = new HttpServer();

// "get" and "list" REST endpoints
server.router.get(
  /^\/(?<resource>[^\/]+)(?:\/(?<id>[^\/]+))?$/,
  async (req: HttpRequest, { resource, id }: Record<string, string>) => {
    const controller = await di.get(`controller.rest.${resource}`);

    return id
      ? controller.get(id)
      : controller.list(req.url.searchParams); // req.url is an URL object
  },
);

// "create" and "update" REST endpoints
server.router.post(
  /^\/(?<resource>[^\/]+)(?:\/(?<id>[^\/]+))?$/,
  async (req: HttpRequest, { resource, id }: Record<string, string>) => {
    const controller = await di.get(`controller.rest.${resource}`);

    return id
      ? controller.update(id, await req.json())
      : controller.create(await req.json());
  },
);

// "delete" REST endpoint
server.router.delete(
  /^\/(?<resource>[^\/]+)\/(?<id>[^\/]+)$/,
  async (req: HttpRequest, { resource, id }: Record<string, string>) => {
    const controller = await di.get(`controller.rest.${resource}`);
    return controller.delete(id);
  },
);

// router will wait for the event handler
// to complete even though it's async,
// how neat is that?
server.on('request', async (req) => {
  const auth = await di.get('awesome-authenticator');
  const user = await auth.loadSession(req.cookies.sid);

  if (!user) {
    throw new HttpForbiddenError();
  }
});

(async () => {
    await server.listen(8000);
    console.log('Server is listening.');
})();
```

## More docs

... might come some day if I feel like it.. honestly, I don't expect
anybody other than me will use this, most people still think Express
is the way to go. If you feel like it, try reading the source code,
there isn't a lot of it and it doesn't do anything too non-obvious.
