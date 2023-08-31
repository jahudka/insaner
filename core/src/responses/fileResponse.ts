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
  private readonly request?: HttpRequest;
  private range?: ByteRange;

  readonly path: string;

  constructor(
    request: HttpRequest,
    path: string,
    contentType: string,
    disposition?: ContentDisposition,
    fileName?: string,
  );
  constructor(
    path: string,
    contentType: string,
    disposition?: ContentDisposition,
    fileName?: string,
  );
  constructor(
    requestOrPath: HttpRequest | string,
    pathOrContentType: string,
    contentTypeOrDisposition?: ContentDisposition | string,
    dispositionOrFileName?: ContentDisposition,
    maybeFileName?: string,
  ) {
    const [request, path, contentType, disposition, fileName] = typeof requestOrPath === 'string'
      ? [undefined, requestOrPath, pathOrContentType, contentTypeOrDisposition, dispositionOrFileName]
      : [requestOrPath, pathOrContentType, contentTypeOrDisposition, dispositionOrFileName, maybeFileName];

    super();
    this.request = request;
    this.path = path;
    this.setHeader('Content-Type', contentType!);

    if (disposition) {
      const fn = fileName ?? basename(path);
      this.setHeader('Content-Disposition', `${disposition}; filename="${fn}"`);
    }
  }

  async send(serverResponse: ServerResponse): Promise<void> {
    const info = await stat(this.path);

    if (this.request && this.request.method !== 'HEAD') {
      this.setHeader('Accept-Ranges', 'bytes');

      const ranges = parseHttpRange(this.request.headers.range);

      if (ranges && ranges.length === 1) {
        const [[start, end]] = ranges;

        this.range = [
          start < 0 ? Math.max(0, info.size + start) : Math.min(info.size, start),
          end === undefined ? info.size : Math.min(info.size, end),
        ];

        this.setStatus(206);
        this.setHeader('Content-Range', `bytes ${this.range.join('-')}/${info.size}`);

        return super.send(serverResponse);
      }
    }

    this.request && this.setHeader('Accept-Ranges', 'bytes');
    this.setHeader('Content-Length', info.size.toString());
    return super.send(serverResponse);
  }

  protected async writeBody(sink: Writable): Promise<void> {
    if (this.request?.method === 'HEAD') {
      return new Promise((r) => sink.end(r));
    }

    return new Promise((resolve, reject) => {
      const [start, end] = this.range ?? [];
      const fs = createReadStream(this.path, { start, end });

      fs.on('error', reject);
      sink.on('finish', resolve);

      fs.pipe(sink);
    });
  }
}
