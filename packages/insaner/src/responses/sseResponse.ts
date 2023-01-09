import { Stream, Readable, Transform, TransformCallback } from 'stream';
import { Cookie } from '../utils';
import { StreamResponse } from './streamResponse';

export class ServerEvent {
  constructor(
    readonly event?: string,
    readonly data?: any,
    readonly id?: string,
    readonly retry?: number,
  ) {}
}

class SSETransform extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
      readableObjectMode: false,
    });
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    if (chunk instanceof ServerEvent) {
      chunk.event !== undefined && this.push(`event: ${chunk.event}`);
      chunk.data !== undefined && this.push(`data: ${JSON.stringify(chunk.data)}`);
      chunk.id !== undefined && this.push(`id: ${JSON.stringify(chunk.id)}`);
      chunk.retry !== undefined && this.push(`retry: ${JSON.stringify(chunk.retry)}`);
    } else if (typeof chunk === 'object' && chunk !== null) {
      this.push(`data: ${JSON.stringify(chunk)}`);
    } else if (typeof chunk === 'string') {
      this.push(`event: ${chunk}`);
    }

    callback();
  }
}

export class SSEResponse extends StreamResponse {
  constructor(
    stream: AsyncIterable<ServerEvent | string | any> | Iterable<ServerEvent | string | any> | Readable,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    stream: AsyncIterable<ServerEvent | string | any> | Iterable<ServerEvent | string | any> | Readable,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(a0: any, b0?: any, c0?: any, d0?: any) {
    const [status, events, headers, cookies] = typeof a0 === 'number'
      ? [a0, b0, c0, d0]
      : [200, a0, b0, c0];
    const stream = events instanceof Stream ? events as Readable : Readable.from(events);
    super(status, stream.pipe(new SSETransform()), headers, cookies);

    this.setHeader('Content-Type', 'text/event-stream');
    this.setHeader('Connection', 'keep-alive');
    this.setHeader('Cache-Control', 'no-cache');
  }
}
