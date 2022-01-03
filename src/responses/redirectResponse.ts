import { HttpResponse } from '../httpResponse';

export class RedirectResponse extends HttpResponse {
  readonly url: string;

  constructor(location: string, status: number = 302) {
    super(status, { location });
    this.url = location;
  }
}
