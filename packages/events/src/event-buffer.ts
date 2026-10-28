import type { CasinoEvent } from "@casino-ops/shared";

export interface EventBufferOptions {
  maxSize: number;
  flushIntervalMs: number;
  onFlush: (events: CasinoEvent[]) => void | Promise<void>;
}

export class EventBuffer {
  readonly #options: EventBufferOptions;
  #events: CasinoEvent[] = [];
  #timer: ReturnType<typeof setInterval> | undefined;
  #flushing = false;

  constructor(options: EventBufferOptions) {
    if (options.maxSize < 1 || options.flushIntervalMs < 1) {
      throw new Error("Buffer limits must be positive integers");
    }
    this.#options = options;
  }

  start(): void {
    if (this.#timer) return;
    this.#timer = setInterval(() => void this.flush(), this.#options.flushIntervalMs);
    this.#timer.unref();
  }

  async push(event: CasinoEvent): Promise<void> {
    this.#events.push(event);
    if (this.#events.length >= this.#options.maxSize) await this.flush();
  }

  async flush(): Promise<void> {
    if (this.#flushing || this.#events.length === 0) return;
    this.#flushing = true;
    const batch = this.#events.splice(0, this.#options.maxSize);
    try {
      await this.#options.onFlush(batch);
    } catch (error) {
      this.#events.unshift(...batch);
      throw error;
    } finally {
      this.#flushing = false;
    }
  }

  async stop(): Promise<void> {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = undefined;
    await this.flush();
  }

  get size(): number {
    return this.#events.length;
  }
}
