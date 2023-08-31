import { HttpResponse } from '../httpResponse';
import { RedirectResponse } from '../responses';

export class HttpForcedResponse extends Error {
  readonly response: HttpResponse;

  constructor(responseOrStatus: HttpResponse | number) {
    super();
    this.response = typeof responseOrStatus === 'number'
      ? new HttpResponse(responseOrStatus)
      : responseOrStatus;
  }
}

export class HttpRedirect extends HttpForcedResponse {
  constructor(location: string, status: number = 302) {
    super(new RedirectResponse(status, location));
  }
}

export class HttpBadRequestError extends HttpForcedResponse {
  constructor(responseOrStatus: HttpResponse | number = 400) {
    super(responseOrStatus);
  }
}

export class HttpUnauthorizedError extends HttpBadRequestError {
  constructor(responseOrStatus: HttpResponse | number = 401) {
    super(responseOrStatus);
  }
}

export class HttpForbiddenError extends HttpBadRequestError {
  constructor(responseOrStatus: HttpResponse | number = 403) {
    super(responseOrStatus);
  }
}

export class HttpNotFoundError extends HttpBadRequestError {
  constructor(responseOrStatus: HttpResponse | number = 404) {
    super(responseOrStatus);
  }
}

export class HttpMethodNotAllowedError extends HttpBadRequestError {
  constructor(responseOrStatus: HttpResponse | number = 405) {
    super(responseOrStatus);
  }
}
