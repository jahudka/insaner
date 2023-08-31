import { Writable } from 'stream';
import { Cookie } from '../utils';
import { HttpResponse } from '../httpResponse';

export class JsonResponse extends HttpResponse {
  readonly payload: any;
  private readonly pretty: boolean;

  constructor(
    payload: any,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    payload: any,
    pretty: boolean,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    payload: any,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    payload: any,
    pretty: boolean,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(a0: any, b0?: any, c0?: any, d0?: any, e0?: any) {
    const [status, payload, c1, d1, e1] = typeof a0 === 'number'
      ? [a0, b0, c0, d0, e0]
      : [200, a0, b0, c0, d0];
    const [pretty, headers, cookies] = typeof c1 === 'boolean'
      ? [c1, d1, e1]
      : [false, c1, d1];

    super(status, headers, cookies);
    this.payload = payload;
    this.pretty = pretty;
    this.setHeader('Content-Type', 'application/json');
  }

  protected async writeBody(sink: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(this.payload, null, this.pretty ? 2 : undefined);

      sink.write(payload, (err) => {
        if (err) {
          reject(err);
        } else {
          sink.end(resolve);
        }
      });
    });
  }
}
