import type { CasinoDomain, CasinoEvent } from "@casino-ops/shared";

export type EventHandler = (event: CasinoEvent) => void | Promise<void>;
export type Unsubscribe = () => void;

export class EventBus {
  readonly #domainHandlers = new Map<CasinoDomain, Set<EventHandler>>();
  readonly #allHandlers = new Set<EventHandler>();

  async publish(event: CasinoEvent): Promise<void> {
    const handlers = [
      ...this.#allHandlers,
      ...(this.#domainHandlers.get(event.domain) ?? []),
    ];
    await Promise.allSettled(handlers.map((handler) => handler(event)));
  }

  subscribe(domain: CasinoDomain, handler: EventHandler): Unsubscribe {
    const handlers = this.#domainHandlers.get(domain) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.#domainHandlers.set(domain, handlers);
    return () => handlers.delete(handler);
  }

  subscribeAll(handler: EventHandler): Unsubscribe {
    this.#allHandlers.add(handler);
    return () => this.#allHandlers.delete(handler);
  }
}

