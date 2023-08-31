import { HttpRequest } from '../httpRequest';
import { Route } from './types';

export class SimpleRoute implements Route<Record<string, string>> {
  private readonly pattern: RegExp;
  private readonly methods?: string[];

  constructor(pattern: RegExp, methods?: string[]) {
    this.pattern = pattern;
    this.methods = methods && methods.map((method) => method.toUpperCase());
  }

  match(request: HttpRequest): Record<string, string> | false {
    if (this.methods && !this.methods.includes(request.method)) {
      return false;
    }

    const match = request.url.pathname.match(this.pattern);
    return match ? match.groups || {} : false;
  }
}
