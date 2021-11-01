import { HttpNotFoundError } from '../utils';
import { HttpRequest } from '../httpRequest';
import { HttpResponse } from '../httpResponse';
import { SimpleRoute } from './simpleRoute';
import { Route, RequestHandler, SimpleRequestHandler } from './types';

export class Router {
  private readonly routes: Map<Route, RequestHandler> = new Map();

  add<T>(route: Route<T>, handler: RequestHandler<T>): void {
    this.routes.set(route, handler);
  }

  get(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['GET']), handler);
  }

  post(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['POST']), handler);
  }

  patch(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['PATCH']), handler);
  }

  put(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['PUT']), handler);
  }

  delete(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['DELETE']), handler);
  }

  head(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['HEAD']), handler);
  }

  options(pattern: RegExp, handler: SimpleRequestHandler): void {
    this.add(new SimpleRoute(pattern, ['OPTIONS']), handler);
  }

  async route(request: HttpRequest): Promise<HttpResponse> {
    for (const [route, handler] of this.routes) {
      const params = await route.match(request);

      if (params !== false) {
        return handler(request, params);
      }
    }

    throw new HttpNotFoundError();
  }
}
