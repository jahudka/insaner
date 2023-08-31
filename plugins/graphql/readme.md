# GraphQL-HTTP bridge for Insaner

This plugin bridges the reference `graphql-http` implementation into Insaner.

Installation:

```shell
npm install --save @insaner/graphql
```

Usage:

```typescript
import { HttpServer } from 'insaner';
import { GraphQLHandler } from '@insaner/graphql';

const server = new HttpServer();

server.router.post(/^\/?graphql\/?$/, new GraphQLHandler({
  schema: makeExecutableSchema({ ... }),
  context: () => new Context(),
  root: myRootObject,
}));
```
