import { ServerResponse } from 'http';
import { Transform, Writable } from 'stream';
import { Cookie, CookieOptions } from './utils';

export class HttpResponse {
  private _status: number = 200;
  private readonly _headers: Record<string, string[]> = {};
  private readonly _cookies: Record<string, Cookie> = {};
  private readonly _transforms: Transform[] = [];

  constructor(
    status: number = 200,
    headers: Record<string, string | string[]> = {},
    cookies: Cookie[] = [],
  ) {
    this.setStatus(status);

    for (const [name, value] of Object.entries(headers)) {
      this.setHeader(name, value);
    }

    for (const cookie of cookies) {
      this.setCookie(cookie);
    }
  }

  get status(): number {
    return this._status;
  }

  setStatus(status: number): void {
    if (status < 200 || status > 599) {
      throw new Error(`Invalid HTTP status: ${status}`);
    }

    this._status = status;
  }

  get headers(): Record<string, string[]> {
    return { ...this._headers };
  }

  setHeader(name: string, value: string | string[]): void {
    this._headers[name.toLowerCase()] = Array.isArray(value) ? value : [value];
  }

  addHeader(name: string, value: string | string[]): void {
    if (Array.isArray(value)) {
      if (!value.length) {
        return;
      }
    } else {
      value = [value];
    }

    const header = name.toLowerCase();
    this._headers[header] ??= [];
    this._headers[header].push(...value);
  }

  getHeader(name: string): string[] | undefined {
    return this._headers[name.toLowerCase()];
  }

  removeHeader(name: string): void {
    delete this._headers[name.toLowerCase()];
  }

  get cookies(): Cookie[] {
    return Object.values(this._cookies);
  }

  setCookie(cookie: Cookie): void;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  setCookie(cookieOrName: Cookie | string, maybeValue?: string, maybeOptions?: CookieOptions): void {
    if (typeof cookieOrName === 'string') {
      this._cookies[cookieOrName] = new Cookie(cookieOrName, maybeValue!, maybeOptions);
    } else {
      this._cookies[cookieOrName.name] = cookieOrName;
    }
  }

  getCookie(name: string): Cookie | undefined {
    return this._cookies[name];
  }

  addTransform(transform: Transform): void {
    this._transforms.push(transform);
  }

  async send(serverResponse: ServerResponse): Promise<void> {
    serverResponse.statusCode = this.status;

    this.addHeader('Set-Cookie', this.cookies.map(cookie => cookie.toString()));

    for (const [header, values] of Object.entries(this._headers)) {
      serverResponse.setHeader(header, values);
    }

    const sink = this._transforms.reduceRight((sink: Writable, transform) => {
      transform.on('error', (e) => sink.emit('error', e));
      transform.pipe(sink);
      return transform;
    }, serverResponse);

    await this.writeBody(sink);
  }

  protected async writeBody(sink: Writable): Promise<void> {
    return new Promise((resolve) => {
      sink.end(resolve);
    });
  }
}
