import { createReadStream } from 'fs';
import { ServerResponse } from 'http';
import { Cookie } from '../utils';
import { HttpResponse } from '../httpResponse';

export class FileResponse extends HttpResponse {
  private readonly path: string;

  constructor(
    path: string,
    contentType: string,
    status: number = 200,
    headers: Record<string, string | string[]> = {},
    cookies: Cookie[] = [],
  ) {
    super(status, headers, cookies);
    this.path = path;
    this.setHeader('Content-Type', contentType);
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const fp = createReadStream(this.path);

      fp.on('error', reject);
      serverResponse.on('finish', resolve);

      fp.pipe(serverResponse);
    });
  }
}
