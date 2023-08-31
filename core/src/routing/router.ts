import { HttpNotFoundError } from '../utils';
import { HttpRequest } from '../httpRequest';
import { SimpleRoute } from './simpleRoute';
import { Route, Handler, SimpleHandler, RequestHandler } from './types';

export class Router {
  private readonly routes: Map<Route, RequestHandler> = new Map();

  add<T>(route: Route<T>, handler: Handler<T>): void {
    this.routes.set(route, normalizeHandler(handler));
  }

  any(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern), handler);
  }

  get(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['GET']), handler);
  }

  post(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['POST']), handler);
  }

  patch(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['PATCH']), handler);
  }

  put(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['PUT']), handler);
  }

  delete(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['DELETE']), handler);
  }

  head(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['HEAD']), handler);
  }

  options(pattern: RegExp, handler: SimpleHandler): void {
    this.add(new SimpleRoute(pattern, ['OPTIONS']), handler);
  }

  async route<T>(request: HttpRequest): Promise<[RequestHandler<T>, T]> {
    for (const [route, handler] of this.routes) {
      const params = await route.match(request);

      if (params !== false) {
        return [handler, params];
      }
    }

    throw new HttpNotFoundError();
  }
}

function normalizeHandler<T>(handler: Handler<T>): RequestHandler<T> {
  return typeof handler === 'function' ? { handle: handler } : handler;
}
