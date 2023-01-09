import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { Writable } from 'stream';
import { URL } from 'url';
import { StreamBuffer } from './utils';

export class HttpRequest {
  private _method?: string;
  private _cookies?: Record<string, string>;
  private _body?: Promise<string>;

  readonly raw: IncomingMessage;

  constructor(req: IncomingMessage) {
    this.raw = req;
  }

  get method(): string {
    return this._method || (this._method = this.raw.method?.toUpperCase() || 'GET');
  }

  get url(): URL {
    return new URL(this.raw.url || '/', `http://${this.raw.headers.host || 'localhost'}`);
  }

  get headers(): IncomingHttpHeaders {
    return { ...this.raw.headers };
  }

  get cookies(): Record<string, string> {
    if (!this._cookies) {
      const cookies = (this.raw.headers.cookie || '').trim().split(/\s*;\s*/g);
      this._cookies = {};

      for (const cookie of cookies) {
        const m = cookie.match(/^(.+?)\s*=\s*(.*)$/);

        if (m) {
          this._cookies[m[1]] = decodeURIComponent(m[2]);
        }
      }
    }

    return { ... this._cookies };
  }

  async text(): Promise<string> {
    if (!this._body) {
      this._body = this.raw.pipe(new StreamBuffer()).consume();
    }

    return this._body;
  }

  async json(): Promise<any> {
    return JSON.parse(await this.text());
  }

  pipe<T extends Writable>(dst: T): T {
    return this.raw.pipe(dst);
  }
}
