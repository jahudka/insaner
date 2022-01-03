import { open } from 'fs/promises';
import { contentType } from 'mime-types';
import { extname } from 'path';
import { HttpRequest } from '../httpRequest';
import { HttpResponse } from '../httpResponse';
import { FileResponse } from '../responses';
import { RequestHandler } from '../routing';
import { HttpNotFoundError } from '../utils';
import { StaticRequestParams } from './types';

export class StaticHandler implements RequestHandler<StaticRequestParams> {
  private readonly basePath: string;
  private readonly index: string[];

  constructor(basePath: string, index: string[] = ['index.htm']) {
    this.basePath = basePath.replace(/\/$/, '');
    this.index = index;
  }

  async handle(request: HttpRequest, { path }: StaticRequestParams): Promise<HttpResponse> {
    const fullPath = await this.resolvePath(path);
    const type = fullPath && contentType(extname(fullPath));

    if (!fullPath || !type) {
      throw new HttpNotFoundError();
    }

    return new FileResponse(fullPath, type);
  }

  private async resolvePath(path: string = '/'): Promise<string | undefined> {
    const requireDir = /\/$/.test(path);
    const fullPath = this.basePath + path.replace(/^\/?/, '/').replace(/\/$/, '');
    const candidates: string[] = [];

    if (!requireDir) {
      candidates.push(fullPath);
    }

    candidates.push(...this.index.map((file) => `${fullPath}/${file}`));

    for (const candidate of candidates) {
      try {
        const fp = await open(candidate, 'r');
        await fp.close();
        return candidate;
      } catch (e) { /* continue */ }
    }

    return undefined;
  }
}
