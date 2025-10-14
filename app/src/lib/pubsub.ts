export class PubSub {
  private listeners = new Map<string, Set<Function>>();

  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('PubSub listener error:', error);
        }
      });
    }
  }

  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }
}

class ServerPubSub {
  emit(event: string, data?: any): void {
    // No-op on server
  }

  on(event: string, listener: Function): () => void {
    // No-op on server
    return () => {};
  }
}

// Only create instance on client side
let pubsub: PubSub | ServerPubSub;
if (typeof window !== 'undefined') {
  pubsub = new PubSub();
} else {
  pubsub = new ServerPubSub();
}

export { pubsub };
