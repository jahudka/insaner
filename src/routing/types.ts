import { HttpRequest } from '../httpRequest';
import { HttpResponse } from '../httpResponse';

export interface Route<T = any> {
  match(request: HttpRequest): Promise<T | false> | T | false;
}

export interface RequestHandler<T = any> {
  handle(request: HttpRequest, params: T): Promise<HttpResponse> | HttpResponse;
}

export type RequestCallback<T = any> = {
  (request: HttpRequest, params: T): Promise<HttpResponse> | HttpResponse;
};

export type Handler<T = any> = RequestHandler<T> | RequestCallback<T>;

export type SimpleHandler = Handler<Record<string, string>>;
