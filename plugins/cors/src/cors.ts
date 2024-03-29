import { HttpRequest, HttpResponse, RequestMiddleware, RequestMiddlewareNext } from 'insaner';
import { CorsOptions } from './types';

type NormalizedOptions = {
  route: RegExp;
  origin: (request?: string) => string | undefined;
  headers: (request?: string) => string | undefined;
  methods: (request?: string) => string | undefined;
  credentials?: boolean;
};

export class CorsMiddleware implements RequestMiddleware {
  private readonly options: NormalizedOptions;

  constructor(options: CorsOptions = {}) {
    this.options = normalizeOptions(options);
  }

  async handle(request: HttpRequest, next: RequestMiddlewareNext): Promise<HttpResponse> {
    const matchesRoute = this.options.route.test(request.url.pathname);
    const response = matchesRoute && request.method === 'OPTIONS' ? new HttpResponse() : await next();
    return matchesRoute ? this.addHeaders(response, request) : response;
  }

  private addHeaders(response: HttpResponse, request: HttpRequest): HttpResponse {
    const origin = this.options.origin(request.headers.origin);
    const headers = this.options.headers(request.headers['access-control-request-headers']);
    const methods = this.options.methods(request.headers['access-control-request-method']);

    if (origin !== undefined) {
      response.setHeader('Access-Control-Allow-Origin', origin);

      if (this.options.credentials) {
        response.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }

    if (headers !== undefined) {
      response.setHeader('Access-Control-Allow-Headers', headers);
    }

    if (methods !== undefined) {
      response.setHeader('Access-Control-Allow-Methods', methods);
    }

    return response;
  }
}

function normalizeOptions({ route, origin, headers, methods, credentials }: CorsOptions): NormalizedOptions {
  return {
    route: route ?? /^/,
    origin: normalizeOption(origin, true),
    headers: normalizeOption(headers),
    methods: normalizeOption(methods),
    credentials,
  };
}

function normalizeOption(
  value?: RegExp | string | string[] | true,
  single?: boolean,
): (request?: string) => string | undefined {
  if (value instanceof RegExp) {
    const pattern = new RegExp(value.source, 'i');
    return (request) => request?.trim().split(/\s*,\s*/g).filter((v) => pattern.test(v)).join(', ');
  } else if (value === true) {
    return (request) => request;
  } else if (value === undefined) {
    return () => undefined;
  }

  if (single) {
    const values: (string | undefined)[] = typeof value === 'string' ? [value] : value;
    return (request) => values.includes(request) ? request : undefined;
  }

  const values = typeof value === 'string' ? value : value.join(', ');
  return () => values;
}

