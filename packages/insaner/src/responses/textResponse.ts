import { ServerResponse } from 'http';
import { Cookie } from '../utils';
import { HttpResponse } from '../httpResponse';

export class TextResponse extends HttpResponse {
  readonly content: string;

  constructor(
    content: string,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    content: string,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    content: string,
    type: string,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    content: string,
    type: string,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(a0: any, b0?: any, c0?: any, d0?: any, e0?: any) {
    const [status, content, c1, d1, e1] = typeof a0 === 'number'
      ? [a0, b0, c0, d0, e0]
      : [200, a0, b0, c0, d0];
    const [type, headers, cookies] = typeof c1 === 'string'
      ? [c1, d1, e1]
      : ['text/plain', c1, d1];

    super(status, headers, cookies);
    this.content = content;
    this.setHeader('Content-Type', type);
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      serverResponse.write(this.content, (err) => {
        if (err) {
          reject(err);
        } else {
          serverResponse.end(resolve);
        }
      });
    });
  }
}
