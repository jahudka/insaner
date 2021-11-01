import { ServerResponse } from 'http';
import { Cookie, CookieOptions } from './utils';

export class HttpResponse {
  private status: number = 200;
  private readonly headers: Record<string, string[]> = {};
  private readonly cookies: Record<string, Cookie> = {};

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

  setStatus(status: number): void {
    if (status < 200 || status > 599) {
      throw new Error(`Invalid HTTP status: ${status}`);
    }

    this.status = status;
  }

  setHeader(name: string, value: string | string[]): void {
    this.headers[name.toLowerCase()] = Array.isArray(value) ? value : [value];
  }

  addHeader(name: string, value: string | string[]): void {
    const header = name.toLowerCase();
    const values = this.headers[header] || (this.headers[header] = []);
    values.push(...(Array.isArray(value) ? value : [value]));
  }

  removeHeader(name: string): void {
    delete this.headers[name.toLowerCase()];
  }

  setCookie(cookie: Cookie): void;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  setCookie(cookieOrName: Cookie | string, maybeValue?: string, maybeOptions?: CookieOptions): void {
    if (typeof cookieOrName === 'string') {
      this.cookies[cookieOrName] = new Cookie(cookieOrName, maybeValue!, maybeOptions);
    } else {
      this.cookies[cookieOrName.name] = cookieOrName;
    }
  }

  async send(serverResponse: ServerResponse): Promise<void> {
    serverResponse.statusCode = this.status;

    for (const cookie of Object.values(this.cookies)) {
      this.addHeader('Set-Cookie', cookie.toString());
    }

    for (const [header, values] of Object.entries(this.headers)) {
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
