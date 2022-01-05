import { HttpResponse } from '../httpResponse';

export class RedirectResponse extends HttpResponse {
  readonly url: string;

  constructor(location: string);
  constructor(status: number, location: string);
  constructor(locationOrStatus: any, maybeLocation?: any) {
    const [status, location] = typeof locationOrStatus === 'number'
      ? [locationOrStatus, maybeLocation]
      : [302, locationOrStatus];
    super(status, { location });
    this.url = location;
  }
}
