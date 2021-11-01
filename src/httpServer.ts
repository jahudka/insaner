import { Server, IncomingMessage, ServerResponse, createServer } from 'http';
import { Socket } from 'net';
import { Duplex } from 'stream';
import { AsyncEvent, AsyncEventEmitter } from './events';
import { HttpForcedResponse } from './utils';
import { HttpRequest } from './httpRequest';
import { Router } from './routing';

export class HttpServer extends AsyncEventEmitter {
  private readonly server: Server;
  readonly router: Router;

  constructor(router: Router = new Router()) {
    super();
    this.server = createServer();
    this.router = router;
  }

  async listen(port: number | string): Promise<void> {
    return new Promise((resolve) => {
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

  protected async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const request = new HttpRequest(req);

      await this.emitAsync('request', request);

      const response = await this.router.route(request);
      await response.send(res);
    } catch (e) {
      if (res.headersSent) {
        throw e;
      }

      if (e instanceof HttpForcedResponse) {
        await e.response.send(res);
      } else {
        res.statusCode = 500;
        await new Promise((r) => res.end(r));
      }
    }
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

  emitAsync(event: 'upgrade', req: HttpRequest, socket: Duplex, head: Buffer): Promise<boolean>;
  on(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  once(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  off(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  addListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  removeListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  prependListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;
  prependOnceListener(eventName: 'upgrade', listener: (req: HttpRequest, socket: Duplex, head: Buffer, evt: AsyncEvent) => Promise<void> | void): this;

  removeAllListeners(event?: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'upgrade'): this;
  listeners(eventName: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'upgrade'): Function[];
  rawListeners(eventName: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'upgrade'): Function[];
  listenerCount(eventName: string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'upgrade'): number;
  eventNames(): (string | symbol | 'close' | 'connection' | 'error' | 'listening' | 'request' | 'upgrade')[];
}
