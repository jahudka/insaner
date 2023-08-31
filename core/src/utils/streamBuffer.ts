import { Writable } from 'stream';

export class StreamBuffer extends Writable {
  private readonly bufferedChunks: any[] = [];

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
    this.bufferedChunks.push(chunk);
    callback();
  }

  async consume(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.on('finish', () => {
        resolve(this.bufferedChunks.join(''));
      });

      this.on('error', (err) => {
        reject(err);
      });
    });
  }
}
