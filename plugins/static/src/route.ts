import { HttpMethodNotAllowedError, HttpRequest, Route } from 'insaner';
import { StaticRequestParams } from './types';

export class StaticRoute implements Route<StaticRequestParams> {
  private readonly pattern: RegExp;

  constructor(prefix: string = '') {
    this.pattern = createPattern(prefix);
  }

  match(request: HttpRequest): StaticRequestParams | false {
    const match = request.url.pathname.match(this.pattern);

    if (!match) {
      return false;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      throw new HttpMethodNotAllowedError();
    }

    return match.groups ?? {};
  }
}

function createPattern(basePath: string): RegExp {
  const prefix = escapeRe(basePath.replace(/^\/|\/$/g, ''));
  return new RegExp(`^\/?${prefix}(?<path>(?:\/[^.\/][^\/]*)+\/?)?$`);
}

function escapeRe(s: string): string {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
