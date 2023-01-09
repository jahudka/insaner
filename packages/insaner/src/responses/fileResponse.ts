import { createReadStream } from 'fs';
import { ServerResponse } from 'http';
import { basename } from 'path';
import { HttpResponse } from '../httpResponse';

export type ContentDisposition = 'attachment' | 'inline';

export class FileResponse extends HttpResponse {
  readonly path: string;

  constructor(
    path: string,
    contentType: string,
    disposition?: ContentDisposition,
    fileName?: string,
  ) {
    super();
    this.path = path;
    this.setHeader('Content-Type', contentType);

    if (disposition) {
      const fn = fileName || basename(path);
      this.setHeader('Content-Disposition', `${disposition}; filename="${fn}"`);
    }
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const fs = createReadStream(this.path);

      fs.on('error', reject);
      serverResponse.on('finish', resolve);

      fs.pipe(serverResponse);
    });
  }
}
