import { ServerResponse } from 'http';
import { Cookie } from '../utils';
import { HttpResponse } from '../httpResponse';

export class JsonResponse extends HttpResponse {
  private readonly payload: any;

  constructor(
    payload: any,
    status: number = 200,
    headers: Record<string, string | string[]> = {},
    cookies: Cookie[] = [],
  ) {
    super(status, headers, cookies);
    this.payload = payload;
    this.setHeader('Content-Type', 'application/json');
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      serverResponse.write(JSON.stringify(this.payload), (err) => {
        if (err) {
          reject(err);
        } else {
          serverResponse.end(resolve);
        }
      });
    });
  }
}
