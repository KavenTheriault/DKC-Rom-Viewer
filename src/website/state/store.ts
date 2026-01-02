type Listener = () => void;

export const createStore = <T>(initialState: T) => {
  const state = initialState;
  const listeners = new Set<Listener>();

  return {
    get: () => state,

    set: (stateUpdater: (state: T) => void) => {
      stateUpdater(state);
      listeners.forEach((l) => l());
    },

    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export type Store<T> = ReturnType<typeof createStore<T>>;
