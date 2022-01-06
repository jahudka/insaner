export type MiddlewareNext = () => Promise<void> | void;

export type MiddlewareHandler = {
  (next: MiddlewareNext): Promise<void> | void;
};
