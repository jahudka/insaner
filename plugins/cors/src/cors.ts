import { HttpRequest, HttpResponse, HttpServer } from 'insaner';
import { CorsOptions } from './types';

type NormalizedOptions = {
  route: RegExp;
  origin: (request?: string) => string | undefined;
  headers: (request?: string) => string | undefined;
  methods: (request?: string) => string | undefined;
  credentials?: boolean;
  maxAge: number;
};

export class Cors {
  private readonly options: NormalizedOptions;

  static install(server: HttpServer, options?: CorsOptions): Cors {
    const cors = new Cors(options);
    cors.install(server);
    return cors;
  }

  constructor(options: CorsOptions = {}) {
    this.options = normalizeOptions(options);
  }

  install(server: HttpServer): void {
    server.router.options(this.options.route, () => new HttpResponse());
    server.addListener('response', (res, req) => this.addHeaders(res, req));
  }

  private addHeaders(response: HttpResponse, request: HttpRequest): void {
    if (this.options.route.test(request.url.pathname)) {
      return;
    }

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

    if (this.options.maxAge) {
      response.setHeader('Access-Control-Max-Age', this.options.maxAge.toString());
    }
  }
}

function normalizeOptions({
  route = /^/,
  origin,
  headers,
  methods,
  credentials,
  maxAge = 600,
}: CorsOptions): NormalizedOptions {
  return {
    route,
    origin: normalizeOption(origin, true),
    headers: normalizeOption(headers),
    methods: normalizeOption(methods),
    credentials,
    maxAge,
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

