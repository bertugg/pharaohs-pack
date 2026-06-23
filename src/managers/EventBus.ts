type EventMap = {
  'balance:changed': number;
  'screen:lobby': void;
  'screen:opening': void;
  'screen:results': void;
  'pack:buy': void;
  'pack:generated': import('../game/packSystem/PackGenerator').Pack;
  'card:reveal': { index: number; card: import('../game/cards/CardDefinitions').CardDef };
  'card:revealed': { index: number; card: import('../game/cards/CardDefinitions').CardDef };
  'pack:complete': { totalPayout: number };
  'audio:play': string;
};

type Listener<T> = (payload: T) => void;

class TypedEventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K] extends void ? void : EventMap[K]): void {
    this.listeners.get(event)?.forEach((l) => l(payload as unknown));
  }

  once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const unsub = this.on(event, (p) => { listener(p); unsub(); });
  }
}

export const EventBus = new TypedEventBus();
