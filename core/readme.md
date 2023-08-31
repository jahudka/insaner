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
- Also, cookies work out of the box.
- WebSocket compatible.
- Typings included.

Check out the [GitHub repository][1] for more information and docs.

[1]: https://github.com/jahudka/insaner
