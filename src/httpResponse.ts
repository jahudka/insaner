import { ServerResponse } from 'http';
import { Cookie, CookieOptions } from './utils';

export class HttpResponse {
  private _status: number = 200;
  private readonly _headers: Record<string, string[]> = {};
  private readonly _cookies: Record<string, Cookie> = {};

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
    const header = name.toLowerCase();
    const values = this._headers[header] || (this._headers[header] = []);
    values.push(...(Array.isArray(value) ? value : [value]));
  }

  removeHeader(name: string): void {
    delete this._headers[name.toLowerCase()];
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

  normalize(): void {
    this.addHeader('Set-Cookie', Object.values(this._cookies).map(cookie => cookie.toString()));
  }

  async send(serverResponse: ServerResponse): Promise<void> {
    serverResponse.statusCode = this.status;

    for (const [header, values] of Object.entries(this._headers)) {
      serverResponse.setHeader(header, values);
    }

    await this.writeBody(serverResponse);
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve) => {
      serverResponse.end(resolve);
    });
  }
}
