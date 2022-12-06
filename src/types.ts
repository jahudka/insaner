import { HttpRequest } from './httpRequest';

export type MiddlewareNext = () => Promise<void> | void;

export type MiddlewareHandler = {
  (request: HttpRequest, next: MiddlewareNext): Promise<void> | void;
};
