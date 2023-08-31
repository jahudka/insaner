import { ExecutionArgs, ExecutionResult, execute } from 'graphql';
import { Handler, OperationContext, Request, createHandler } from 'graphql-http';
import { HttpRequest, HttpResponse, RequestHandler, TextResponse } from 'insaner';
import { GraphQLHandlerOptions, GraphQLMiddleware, GraphQLMiddlewareNext } from './types';

export class GraphQLHandler<Context extends OperationContext = any, Root extends object = any> implements RequestHandler {
  private readonly handler: Handler<HttpRequest, Context>;
  private readonly middlewares: GraphQLMiddleware<Context, Root>[] = [];

  constructor(options: GraphQLHandlerOptions<Context, Root>) {
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
    return chain(args);
  }
}

function wrapMiddleware(next: GraphQLMiddlewareNext, middleware: GraphQLMiddleware): GraphQLMiddlewareNext {
  return (args) => middleware(args, next);
}

async function asyncExecute(args: ExecutionArgs): Promise<ExecutionResult> {
  return execute(args);
}
