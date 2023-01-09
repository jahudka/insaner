import { EventEmitter } from 'events';
import { AsyncEvent } from './asyncEvent';

export class AsyncEventEmitter extends EventEmitter {
  async emitAsync(eventName: string, ...args: any[]): Promise<boolean> {
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
