import { ExecutionArgs, ExecutionResult, execute, GraphQLError } from 'graphql';
import { Handler, OperationContext, Request, createHandler } from 'graphql-http';
import {
  AsyncEventEmitter,
  HttpRequest,
  HttpResponse,
  RequestHandler,
  TextResponse,
} from 'insaner';
import { GraphQLHandlerOptions, GraphQLMiddleware, GraphQLMiddlewareNext } from './types';

export class GraphQLHandler<Context extends OperationContext = any, Root extends object = any> extends AsyncEventEmitter implements RequestHandler {
  private readonly handler: Handler<HttpRequest, Context>;
  private readonly middlewares: GraphQLMiddleware<Context, Root>[] = [];

  constructor(options: GraphQLHandlerOptions<Context, Root>) {
    super();

    this.handler = createHandler({
      schema: options.schema,
      context: options.context,
      rootValue: options.root,
      execute: this.execute.bind(this),
    });
  }

  registerMiddleware(middleware: GraphQLMiddleware<Context, Root>): void {
    this.middlewares.push(middleware);
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const [body, options] = await this.handler(this.convertRequest(request));

    return new TextResponse(
      options.status,
      body ?? '',
      options.headers?.['content-type'] ?? 'application/json',
      options.headers,
    );
  }

  private convertRequest(request: HttpRequest): Request<HttpRequest, Context> {
    return {
      method: request.method,
      url: request.url.toString(),
      headers: request.headers,
      body: async () => request.json(),
      raw: request,
      context: null as any,
    };
  }

  private async execute(args: ExecutionArgs): Promise<ExecutionResult> {
    const chain = this.middlewares.reduceRight(wrapMiddleware, asyncExecute);
    const result = await chain(args);

    if (result.errors?.length) {
      this.emit('error', result.errors);
    }

    return result;
  }
}

export interface GraphQLHandler<Context extends OperationContext = any, Root extends object = any> {
  emit(eventName: string | symbol, ...args: any[]): boolean;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this;

  emit(event: 'error', errors: ReadonlyArray<GraphQLError>): boolean;
  on(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
  once(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
  off(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
  addListener(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
  removeListener(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
  prependListener(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
  prependOnceListener(eventName: 'error', listener: (errors: ReadonlyArray<GraphQLError>) => void): this;
}

function wrapMiddleware(next: GraphQLMiddlewareNext, middleware: GraphQLMiddleware): GraphQLMiddlewareNext {
  return (args) => middleware(args, next);
}

async function asyncExecute(args: ExecutionArgs): Promise<ExecutionResult> {
  return execute(args);
}
