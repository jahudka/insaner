import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { ServerResponse } from 'http';
import { basename } from 'path';
import { Writable } from 'stream';
import { HttpRequest } from '../httpRequest';
import { HttpResponse } from '../httpResponse';
import { ByteRange, parseHttpRange } from '../utils';

export type ContentDisposition = 'attachment' | 'inline';

export class FileResponse extends HttpResponse {
  private range?: ByteRange;

  constructor(
    readonly path: string,
    private readonly contentType: string,
    private readonly disposition?: ContentDisposition,
    private readonly fileName?: string,
  ) {
    super();
  }

  async send(serverResponse: ServerResponse, request: HttpRequest): Promise<void> {
    const size = await this.getFileSize();

    if (size < 0) {
      this.setStatus(-size);
      return super.send(serverResponse, request);
    }

    this.setHeader('Accept-Ranges', 'bytes');
    this.setHeader('Content-Type', this.contentType);

    if (this.disposition) {
      const fn = this.fileName ?? basename(this.path);
      this.setHeader('Content-Disposition', `${this.disposition}; filename="${fn}"`);
    }

    const ranges = parseHttpRange(request.headers.range);

    if (ranges && ranges.length === 1) {
      const [[start, end]] = ranges;

      this.range = [
        start < 0 ? Math.max(0, size + start) : Math.min(size, start),
        end === undefined ? size : Math.min(size, end),
      ];

      this.setStatus(206);
      this.setHeader('Content-Range', `bytes ${this.range.join('-')}/${size}`);

      return super.send(serverResponse, request);
    }

    this.setHeader('Content-Length', size.toString());
    return super.send(serverResponse, request);
  }

  private async getFileSize(): Promise<number> {
    try {
      const info = await stat(this.path);
      return info.size;
    } catch (e: any) {
      switch (e.code) {
        case 'EACCES': return -403;
        case 'ENOENT': return -404;
        default: throw e;
      }
    }
  }

  protected async writeBody(sink: Writable): Promise<void> {
    if (this.status >= 400) {
      return this.endBody(sink);
    }

    return new Promise((resolve, reject) => {
      const [start, end] = this.range ?? [];
      const fs = createReadStream(this.path, { start, end });

      fs.on('error', () => sink.end(reject));
      sink.on('finish', resolve);

      fs.pipe(sink);
    });
  }
}
