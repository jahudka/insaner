import { HttpResponse } from '../httpResponse';

export class RedirectResponse extends HttpResponse {
  constructor(location: string, status: number = 302) {
    super(status, { location });
  }
}
