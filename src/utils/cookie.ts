export type CookieOptions = {
  expires?: Date | string | number,
  maxAge?: number,
  path?: string,
  domain?: string,
  httpOnly?: boolean,
  secure?: boolean,
  sameSite?: 'strict' | 'lax' | 'none'
}

export class Cookie {
  readonly name: string;
  readonly value: string;
  private readonly options: CookieOptions;

  constructor(
    name: string,
    value: string,
    options: CookieOptions = {},
  ) {
    this.name = sanitizeName(name);
    this.value = value;
    this.options = options;
  }

  toString(): string {
    const parts: string[] = [`${this.name}=${encodeURIComponent(this.value)}`];

    if (this.options.maxAge !== undefined) {
      parts.push(`Max-Age=${this.options.maxAge}`);
    } else if (this.options.expires !== undefined) {
      const expires = this.options.expires instanceof Date
        ? this.options.expires
        : new Date(this.options.expires);
      parts.push(`Expires=${expires.toUTCString()}`);
    }

    this.options.domain && parts.push(`Domain=${this.options.domain}`);
    this.options.path && parts.push(`Path=${this.options.path}`);
    this.options.secure && parts.push('Secure');
    this.options.httpOnly && parts.push('HttpOnly')
    this.options.sameSite && parts.push(`SameSite=${this.options.sameSite.replace(/^./, (c) => c.toUpperCase())}`)

    return parts.join('; ');
  }
}

function sanitizeName(name: string): string {
  if (/[\x00-\x20\x7f()<>@,;:\\"\/[\]?={}]/.test(name)) {
    throw new Error(`Invalid character(s) in cookie name: '${name}'`);
  }

  return name;
}
