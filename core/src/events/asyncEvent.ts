export class AsyncEvent {
  private readonly queue: Promise<any>[] = [];

  waitFor(job: Promise<any>): void {
    this.queue.push(job);
  }

  async resolve(): Promise<this> {
    if (this.queue.length) {
      await Promise.all(this.queue);
    }

    return this;
  }
}
