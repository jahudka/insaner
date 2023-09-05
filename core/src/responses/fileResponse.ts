import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { ServerResponse } from 'http';
import { basename } from 'path';
import { Writable } from 'stream';
import { HttpRequest } from '../httpRequest';
import { HttpResponse } from '../httpResponse';
import { parseHttpRange } from '../utils';
import { MultipartBody } from './multipartBody';

export type ContentDisposition = 'attachment' | 'inline';

export class FileResponse extends HttpResponse {
  private size: number = -1;
  private ranges?: [start: number, end: number][];
  private body?: MultipartBody;

  constructor(
    readonly path: string,
    private readonly contentType: string,
    private readonly disposition?: ContentDisposition,
    private readonly fileName?: string,
  ) {
    super();
  }

  async send(serverResponse: ServerResponse, request: HttpRequest): Promise<void> {
    this.size = await this.getFileSize();

    if (this.size < 0) {
      this.setStatus(-this.size);
      return super.send(serverResponse, request);
    }

    this.setHeader('Accept-Ranges', 'bytes');

    if (this.disposition) {
      const fn = this.fileName ?? basename(this.path);
      this.setHeader('Content-Disposition', `${this.disposition}; filename="${fn}"`);
    }

    this.ranges = parseHttpRange(request.headers.range)?.map(([start, end]) => [
      start < 0 ? Math.max(0, this.size + start) : Math.min(this.size, start),
      end === undefined ? this.size : Math.min(this.size, end),
    ]);

    if (this.ranges) {
      this.setStatus(206);

      if (this.ranges.length > 1) {
        this.body = new MultipartBody();
        this.setHeader('Content-Type', `multipart/byteranges; boundary=${this.body.boundary}`);
      } else {
        this.setHeader('Content-Range', `bytes ${this.ranges[0].join('-')}/${this.size}`);
      }
    } else {
      this.setHeader('Content-Type', this.contentType);
      this.setHeader('Content-Length', this.size.toString());
    }

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
    if (this.size <= 0) {
      return this.endBody(sink);
    }

    if (this.ranges && this.body) {
      for (const [start, end] of this.ranges) {
        this.body
          .add(createReadStream(this.path, { start, end }), this.contentType)
          .setHeader('Content-Range', `${start}-${end}/${this.size}`);
      }

      await this.body.write(sink);
      return this.endBody(sink);
    }

    return new Promise((resolve, reject) => {
      const [[start, end]] = this.ranges ?? [[]];
      const fs = createReadStream(this.path, { start, end });

      fs.on('error', () => sink.end(reject));
      sink.on('finish', resolve);

      fs.pipe(sink);
    });
  }
}
