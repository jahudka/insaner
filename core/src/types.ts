import { HttpRequest } from './httpRequest';
import { HttpResponse } from './httpResponse';

export type MiddlewareNext = () => Promise<HttpResponse> | HttpResponse;

export type MiddlewareHandler = {
  (request: HttpRequest, next: MiddlewareNext): Promise<HttpResponse> | HttpResponse;
};

export interface Middleware {
  handle(request: HttpRequest, next: MiddlewareNext): Promise<HttpResponse> | HttpResponse;
}
