import { Server, IncomingMessage, ServerResponse, createServer } from 'http';
import { Socket } from 'net';
import { Duplex } from 'stream';
import { AsyncEvent, AsyncEventEmitter } from './events';
import { HttpResponse } from './httpResponse';
import {
  RequestMiddleware,
  RequestMiddlewareHandler,
  RequestMiddlewareNext,
  ServerMiddleware,
  ServerMiddlewareHandler,
  ServerMiddlewareNext,
} from './types';
import { HttpForcedResponse } from './utils';
import { HttpRequest } from './httpRequest';
import { Router } from './routing';

export class HttpServer extends AsyncEventEmitter {
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
    middleware: ServerMiddleware | ServerMiddlewareHandler | RequestMiddleware | RequestMiddlewareHandler,
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
    const chain = this.serverMiddlewares.reduceRight<ServerMiddlewareNext>((next, mw) => async () => {
      try {
        await mw.handle(next);
      } catch {}
    }, async () => {
      const request = new HttpRequest(req);
      const response = await this.processRequest(request);
      await this.sendResponse(response, res, request);
    });

    await chain();
  }

  private async processRequest(request: HttpRequest): Promise<HttpResponse> {
    try {
      await this.emitAsync('request', request);

      const chain = this.requestMiddlewares.reduceRight<RequestMiddlewareNext>((next, mw) => async () => {
        try {
          return await mw.handle(request, next);
        } catch (e: any) {
          return this.checkError(e);
        }
      }, () => this.routeRequest(request));

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

  private async sendResponse(response: HttpResponse, res: ServerResponse, request: HttpRequest): Promise<void> {
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

  protected async handleRequestError(request: HttpRequest, error: Error, nested: boolean = false): Promise<HttpResponse> {
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

export interface HttpServer {
  emit(eventName: string | symbol, ...args: any[]): boolean;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this;

  emit(event: 'close'): boolean;
  on(eventName: 'close', listener: () => void): this;
  once(eventName: 'close', listener: () => void): this;
  off(eventName: 'close', listener: () => void): this;
  addListener(eventName: 'close', listener: () => void): this;
  removeListener(eventName: 'close', listener: () => void): this;
  prependListener(eventName: 'close', listener: () => void): this;
  prependOnceListener(eventName: 'close', listener: () => void): this;

  emit(event: 'connection', socket: Socket): boolean;
  on(eventName: 'connection', listener: (socket: Socket) => void): this;
  once(eventName: 'connection', listener: (socket: Socket) => void): this;
  off(eventName: 'connection', listener: (socket: Socket) => void): this;
  addListener(eventName: 'connection', listener: (socket: Socket) => void): this;
  removeListener(eventName: 'connection', listener: (socket: Socket) => void): this;
  prependListener(eventName: 'connection', listener: (socket: Socket) => void): this;
  prependOnceListener(eventName: 'connection', listener: (socket: Socket) => void): this;

  emit(event: 'error', err: Error): boolean;
  on(eventName: 'error', listener: (err: Error) => void): this;
  once(eventName: 'error', listener: (err: Error) => void): this;
  off(eventName: 'error', listener: (err: Error) => void): this;
  addListener(eventName: 'error', listener: (err: Error) => void): this;
  removeListener(eventName: 'error', listener: (err: Error) => void): this;
  prependListener(eventName: 'error', listener: (err: Error) => void): this;
  prependOnceListener(eventName: 'error', listener: (err: Error) => void): this;

  emit(event: 'listening'): boolean;
  on(eventName: 'listening', listener: () => void): this;
  once(eventName: 'listening', listener: () => void): this;
  off(eventName: 'listening', listener: () => void): this;
  addListener(eventName: 'listening', listener: () => void): this;
  removeListener(eventName: 'listening', listener: () => void): this;
  prependListener(eventName: 'listening', listener: () => void): this;
  prependOnceListener(eventName: 'listening', listener: () => void): this;

  emitAsync(event: 'request', req: HttpRequest): Promise<boolean>;
  on(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  once(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  off(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  addListener(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  removeListener(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  prependListener(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  prependOnceListener(eventName: 'request', listener: (req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;

  emitAsync(event: 'response', res: HttpResponse, req: HttpRequest): Promise<boolean>;
  on(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  once(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  off(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  addListener(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  removeListener(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  prependListener(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;
  prependOnceListener(eventName: 'response', listener: (res: HttpResponse, req: HttpRequest, evt: AsyncEvent) => Promise<void> | void): this;

  emitAsync(event: 'request-error', req: HttpRequest, err: Error): Promise<boolean>;
  on(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => void): this;
  once(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => Promise<void> | void): this;
  off(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => Promise<void> | void): this;
  addListener(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => Promise<void> | void): this;
  removeListener(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => Promise<void> | void): this;
  prependListener(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => Promise<void> | void): this;
  prependOnceListener(eventName: 'request-error', listener: (req: HttpRequest, err: Error, evt: AsyncEvent) => Promise<void> | void): this;

  emitAsync(event: 'upgrade', req: HttpRequest, socket: Duplex, head: Buffer): Promise<boolean>;
  on(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  once(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  off(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  addListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  removeListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  prependListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  prependOnceListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;

  removeAllListeners(event?: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'response' | 'request-error' | 'upgrade'): this;
  listeners(eventName: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'response' | 'request-error' | 'upgrade'): Function[];
  rawListeners(eventName: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'response' | 'request-error' | 'upgrade'): Function[];
  listenerCount(eventName: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'response' | 'request-error' | 'upgrade'): number;
  eventNames(): (string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'response' | 'request-error' | 'upgrade')[];
}
