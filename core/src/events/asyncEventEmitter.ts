import { EventEmitter } from 'events';
import { AsyncEvent } from './asyncEvent';
import { AsyncArgs, DefaultEventMap, EventMap, Key } from './types';

export class AsyncEventEmitter<T extends EventMap<T> = DefaultEventMap> extends EventEmitter<T> {
  async emitAsync<K>(eventName: Key<K, T>, ...args: AsyncArgs<K, T>): Promise<boolean> {
    const listeners = this.listeners(eventName);

    if (listeners && listeners.length) {
      const event = new AsyncEvent();
      event.waitFor(callAsyncListeners(listeners, ...args, event));
      await event.resolve();
      return true;
    }

    return false;
  }
}

async function callAsyncListeners(
  // oxlint-disable-next-line typescript/no-unsafe-function-type
  listeners: Function[],
  ...args: any[]
): Promise<void> {
  for (const listener of listeners) {
    const result = listener(...args);

    if (result && result instanceof Promise) {
      await result;
    }
  }
}
