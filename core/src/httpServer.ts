import { Server, IncomingMessage, ServerResponse, createServer } from 'http';
import { Socket } from 'net';
import { Duplex } from 'stream';
import { AsyncEvent, AsyncEventEmitter } from './events';
import { HttpRequest } from './httpRequest';
import { HttpResponse } from './httpResponse';
import { Router } from './routing';
import {
  RequestMiddleware,
  RequestMiddlewareHandler,
  RequestMiddlewareNext,
  ServerMiddleware,
  ServerMiddlewareHandler,
  ServerMiddlewareNext,
} from './types';
import { HttpForcedResponse } from './utils';

export type HttpServerEvents = {
  close: [];
  connection: [socket: Socket];
  error: [error: Error];
  listening: [];
  request: [request: HttpRequest, evt: AsyncEvent];
  response: [response: HttpResponse, request: HttpRequest, evt: AsyncEvent];
  'request-error': [request: HttpRequest, error: Error, evt: AsyncEvent];
  upgrade: [request: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent];
};

export class HttpServer extends AsyncEventEmitter<HttpServerEvents> {
  private readonly server: Server;
  private readonly serverMiddlewares: ServerMiddleware[];
  private readonly requestMiddlewares: RequestMiddleware[];
  readonly router: Router;

  constructor(router: Router = new Router()) {
    super();
    this.server = createServer();
    this.serverMiddlewares = [];
    this.requestMiddlewares = [];
    this.router = router;
  }

  registerMiddleware(
    middleware:
      | ServerMiddleware
      | ServerMiddlewareHandler
      | RequestMiddleware
      | RequestMiddlewareHandler,
  ): void {
    const mw = typeof middleware === 'function' ? { handle: middleware } : middleware;

    if (mw.handle.length > 1) {
      this.requestMiddlewares.push(mw as RequestMiddleware);
    } else {
      this.serverMiddlewares.push(mw as ServerMiddleware);
    }
  }

  async listen(port: number | string): Promise<void> {
    return new Promise((resolve) => {
      this.server.on('error', (err) => this.emit('error', err));
      this.server.on('request', (req, res) => this.handleRequest(req, res));
      this.server.on('upgrade', async (req, socket, head) => {
        await this.emitAsync('upgrade', new HttpRequest(req), socket, head);
      });

      this.server.listen(port, resolve);
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
      });
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chain = this.serverMiddlewares.reduceRight<ServerMiddlewareNext>(
      (next, mw) => async () => {
        try {
          await mw.handle(next);
        } catch {
          // noop
        }
      },
      async () => {
        const request = new HttpRequest(req);
        const response = await this.processRequest(request);
        await this.sendResponse(response, res, request);
      },
    );

    await chain();
  }

  private async processRequest(request: HttpRequest): Promise<HttpResponse> {
    try {
      await this.emitAsync('request', request);

      const chain = this.requestMiddlewares.reduceRight<RequestMiddlewareNext>(
        (next, mw) => async () => {
          try {
            return await mw.handle(request, next);
          } catch (e: any) {
            return this.checkError(e);
          }
        },
        () => this.routeRequest(request),
      );

      return await chain();
    } catch (e: any) {
      return this.handleRequestError(request, e);
    }
  }

  protected async routeRequest(request: HttpRequest): Promise<HttpResponse> {
    try {
      const [handler, params] = await this.router.route(request);
      return await handler.handle(request, params);
    } catch (e: any) {
      return this.checkError(e);
    }
  }

  private async sendResponse(
    response: HttpResponse,
    res: ServerResponse,
    request: HttpRequest,
  ): Promise<void> {
    try {
      await this.emitAsync('response', response, request);
    } catch (e: any) {
      response = e instanceof HttpForcedResponse ? e.response : new HttpResponse(500);
    }

    try {
      await response.send(res, request);
    } catch {
      if (!res.headersSent) {
        res.statusCode = 500;
        await new Promise((r) => res.end(r));
      }
    }
  }

  private checkError(error: any): HttpResponse {
    if (error instanceof HttpForcedResponse) {
      return error.response;
    } else {
      throw error;
    }
  }

  protected async handleRequestError(
    request: HttpRequest,
    error: Error,
    nested: boolean = false,
  ): Promise<HttpResponse> {
    if (error instanceof HttpForcedResponse) {
      return error.response;
    }

    try {
      await this.emitAsync('request-error', request, error);
    } catch (e: any) {
      if (!nested) {
        return this.handleRequestError(request, e, true);
      }
    }

    return new HttpResponse(500);
  }
}
