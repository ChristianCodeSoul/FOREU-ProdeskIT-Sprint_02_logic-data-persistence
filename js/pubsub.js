(function () {
  'use strict' ;

  class EventBus {
    constructor() {
      this.listeners = new Map();
    }
    on(eventName, listener) {
      const eventListeners = this.listeners.get(eventName) || new Set();
      eventListeners.add(listener);
      this.listeners.set(eventName, eventListeners);
      return () => this.off(eventName, listener);
    }
    off(eventName, listener) {
      const eventListeners = this.listeners.get(eventName);
      if (!eventListeners) return;
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
    emit(eventName, payload) {
      const eventListeners = this.listeners.get(eventName);
      if(!eventListeners) return;
      [...eventListeners].forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`EventBus listener error for '${eventName}':`, error);
        }
      });
    }
    clear() {
      this.listeners.clear();
    }
  }
  window.EventBus = EventBus;
  window.PubSub = EventBus;
}());




