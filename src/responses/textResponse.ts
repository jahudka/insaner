import { ServerResponse } from 'http';
import { Cookie } from '../utils';
import { HttpResponse } from '../httpResponse';

export class TextResponse extends HttpResponse {
  private readonly content: string;

  constructor(
    content: string,
    status: number = 200,
    headers: Record<string, string | string[]> = {},
    cookies: Cookie[] = [],
  ) {
    super(status, headers, cookies);
    this.content = content;
    this.setHeader('Content-Type', 'text/plain');
  }

  protected async writeBody(serverResponse: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      serverResponse.write(this.content, (err) => {
        if (err) {
          reject(err);
        } else {
          serverResponse.end(resolve);
        }
      });
    });
  }
}
