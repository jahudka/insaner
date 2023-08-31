import { HttpBadRequestError } from './errors';

export type ByteRange = [start: number, end?: number];

export function parseHttpRange(range?: string): ByteRange[] {
  if (range === undefined) {
    return [];
  } else if (!/^bytes=-?\d/.test(range)) {
    throw new HttpBadRequestError(416);
  }

  return range.slice(6).split(/\s*,\s*/g).map((range) => {
    const [start, end] = range.split(/-/);
    return start === ''
      ? [-parseInt(end, 10)]
      : [parseInt(start, 10), end === '' || end === undefined ? undefined : parseInt(end, 10)];
  });
}
