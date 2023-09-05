import { HttpRequest } from './httpRequest';
import { HttpResponse } from './httpResponse';

export type RequestMiddlewareNext = () => Promise<HttpResponse> | HttpResponse;

export type RequestMiddlewareHandler = {
  (request: HttpRequest, next: RequestMiddlewareNext): Promise<HttpResponse> | HttpResponse;
};

export interface RequestMiddleware {
  handle(request: HttpRequest, next: RequestMiddlewareNext): Promise<HttpResponse> | HttpResponse;
}

export type ServerMiddlewareNext = () => Promise<void> | void;

export type ServerMiddlewareHandler = {
  (next: ServerMiddlewareNext): Promise<void> | void;
};

export interface ServerMiddleware {
  handle(next: ServerMiddlewareNext): Promise<void> | void;
}
