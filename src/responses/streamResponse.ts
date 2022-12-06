import { ServerResponse } from 'http';
import { Readable } from 'stream';
import { HttpResponse } from '../httpResponse';
import { Cookie } from '../utils';

export class StreamResponse extends HttpResponse {
  private readonly stream: Readable;

  constructor(
    stream: Readable,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    stream: Readable,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(a0: any, b0?: any, c0?: any, d0?: any) {
    const [status, stream, headers, cookies] = typeof a0 === 'number'
      ? [a0, b0, c0, d0]
      : [200, a0, b0, c0];
    super(status, headers, cookies);
    this.stream = stream;
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.on('error', reject);
      serverResponse.on('finish', resolve);
      this.stream.pipe(serverResponse);
    });
  }
}
