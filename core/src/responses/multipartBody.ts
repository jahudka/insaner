import { Readable, Writable } from 'stream';
import { v4 } from 'uuid';

export class MultipartBody {
  readonly boundary: string = v4().replace(/-/g, '');

  private readonly parts: MultipartBodyPart[] = [];

  add(part: MultipartBodyPart): MultipartBodyPart;
  add(content: Readable | Buffer | string, type: string, length?: number): MultipartBodyPart;
  add(part: MultipartBodyPart | Readable | Buffer | string, type?: string, length?: number): MultipartBodyPart {
    if (!(part instanceof MultipartBodyPart)) {
      part = new MultipartBodyPart(part, type ?? 'text/plain', length);
    }

    this.parts.push(part);
    return part;
  }

  async write(dst: Writable): Promise<void> {
    for (const part of this.parts) {
      await this.writeTo(dst, `\r\n--${this.boundary}\r\n`);

      for await (const chunk of part) {
        await this.writeTo(dst, chunk);
      }
    }

    await this.writeTo(dst, `\r\n--${this.boundary}--\r\n`);
  }

  private async writeTo(dst: Writable, chunk: any): Promise<void> {
    return new Promise((resolve, reject) => dst.write(chunk, (err) => err ? reject(err) : resolve()));
  }
}

export class MultipartBodyPart {
  private readonly _content: Readable | Buffer | string;
  private readonly _headers: Record<string, string | number> = {};

  constructor(content: Readable | Buffer | string, type: string, length?: number) {
    this._content = content;
    this._headers['content-type'] = type;

    if (Buffer.isBuffer(content)) {
      this._headers['content-length'] = content.byteLength;
    } else if (typeof content === 'string') {
      this._headers['content-length'] = content.length;
    } else if (length !== undefined) {
      this._headers['content-length'] = length;
    }
  }

  setHeader(name: string, value: string): void {
    this._headers[name.toLowerCase()] = value;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<Buffer | string> {
    for (const [header, value] of Object.entries(this._headers)) {
      yield `${header}: ${value}\r\n`;
    }

    yield '\r\n';

    if (Buffer.isBuffer(this._content) || typeof this._content === 'string') {
      yield this._content;
    } else {
      yield * this._content;
    }
  }
}
