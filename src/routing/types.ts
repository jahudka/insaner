import { HttpRequest } from '../httpRequest';
import { HttpResponse } from '../httpResponse';

export interface Route<T = any> {
  match(request: HttpRequest): Promise<T | false> | T | false;
}

export type RequestHandler<T = any> = {
  (request: HttpRequest, params: T): Promise<HttpResponse> | HttpResponse;
};

export type SimpleRequestHandler = RequestHandler<Record<string, string>>;
