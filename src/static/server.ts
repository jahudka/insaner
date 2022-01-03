import { StaticHandler } from './handler';
import { StaticRoute } from './route';

export class StaticServer {
  readonly route: StaticRoute;
  readonly handler: StaticHandler;

  constructor(prefix: string, basePath: string, index?: string[]) {
    this.route = new StaticRoute(prefix);
    this.handler = new StaticHandler(basePath, index);
  }
}
