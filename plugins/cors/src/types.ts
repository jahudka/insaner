export type CorsOptions = {
  route?: RegExp;
  origin?: RegExp | string | string[] | true;
  headers?: RegExp | string | string[] | true;
  methods?: RegExp | string | string[] | true;
  credentials?: boolean;
  maxAge?: number;
};
