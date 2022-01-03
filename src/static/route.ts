import { HttpRequest } from '../httpRequest';
import { Route } from '../routing';
import { StaticRequestParams } from './types';

export class StaticRoute implements Route<StaticRequestParams> {
  private readonly pattern: RegExp;

  constructor(prefix: string) {
    this.pattern = createPattern(prefix);
  }

  match(request: HttpRequest): StaticRequestParams | false {
    if (request.method !== 'GET') {
      return false;
    }

    const match = request.url.pathname.match(this.pattern);
    return match ? match.groups || {} : false;
  }
}

function createPattern(basePath: string): RegExp {
  const prefix = escapeRe(basePath.replace(/^\/|\/$/g, ''));
  return new RegExp(`^\/?${prefix}(?<path>(?:\/[^.\/][^\/]*)+\/?)?$`);
}

function escapeRe(s: string): string {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
