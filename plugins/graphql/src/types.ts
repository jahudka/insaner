import { ExecutionArgs, ExecutionResult, GraphQLSchema } from 'graphql';
import { OperationContext, Request } from 'graphql-http';
import { HttpRequest } from 'insaner';

export type ContextFactory<Context extends OperationContext> = (request: Request<HttpRequest, unknown>) => Promise<Context> | Context;

export type GraphQLHandlerOptions<Context extends OperationContext = any, Root extends object = any> = {
  schema: GraphQLSchema;
  context: Context | ContextFactory<Context>;
  root?: Root;
};

export type TypedExecutionArgs<Context extends OperationContext = any, Root extends object = any> = Omit<ExecutionArgs, 'rootValue' | 'contextValue'> & {
  rootValue?: Root;
  contextValue?: Context;
};

export type GraphQLMiddlewareNext = (args: ExecutionArgs) => Promise<ExecutionResult>;

export type GraphQLMiddleware<Context extends OperationContext = any, Root extends object = any> = {
  (args: TypedExecutionArgs<Context, Root>, next: GraphQLMiddlewareNext): Promise<ExecutionResult>;
};
