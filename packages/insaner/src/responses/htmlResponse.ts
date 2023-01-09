import { Cookie } from '../utils';
import { TextResponse } from './textResponse';

export class HtmlResponse extends TextResponse {

  constructor(
    content: string,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(
    status: number,
    content: string,
    headers?: Record<string, string | string[]>,
    cookies?: Cookie[],
  );
  constructor(a0: any, b0?: any, c0?: any, d0?: any) {
    const [status, content, headers, cookies] = typeof a0 === 'number'
      ? [a0, b0, c0, d0]
      : [200, a0, b0, c0];
    super(status, content, 'text/html', headers, cookies);
  }
}
