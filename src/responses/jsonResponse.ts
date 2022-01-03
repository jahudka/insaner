import { ServerResponse } from 'http';
import { Cookie } from '../utils';
import { HttpResponse } from '../httpResponse';

export class JsonResponse extends HttpResponse {
  readonly payload: any;
  private readonly pretty: boolean;

  constructor(
    payload: any,
    status?: number,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    payload: any,
    pretty: boolean,
    status?: number,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    payload: any,
    prettyOrStatus?: any,
    statusOrHeaders?: any,
    headersOrCookies?: any,
    maybeCookies?: any,
  ) {
    const [pretty, status, headers, cookies]: [boolean, number, Record<string, string | string[]>, Cookie[]]
      = typeof prettyOrStatus === 'boolean'
      ? [prettyOrStatus, statusOrHeaders, headersOrCookies, maybeCookies]
      : [false, prettyOrStatus, statusOrHeaders, headersOrCookies];

    super(status, headers, cookies);
    this.payload = payload;
    this.pretty = pretty;
    this.setHeader('Content-Type', 'application/json');
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(this.payload, null, this.pretty ? 2 : undefined);

      serverResponse.write(payload, (err) => {
        if (err) {
          reject(err);
        } else {
          serverResponse.end(resolve);
        }
      });
    });
  }
}
