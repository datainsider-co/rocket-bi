type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Lets the HTTP layer report an expired session without knowing about React, the router or the query cache.
 * Returns an unsubscribe function.
 */
export function subscribeSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  for (const listener of listeners) listener();
}
