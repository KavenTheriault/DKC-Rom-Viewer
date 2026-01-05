import { AppState } from './types';

type Listener = () => void;

export const createAppStateStore = (initialState: AppState) => {
  const state = initialState;
  const listeners = new Set<Listener>();

  return {
    get: () => state,

    set: (stateUpdater: (state: AppState) => void) => {
      stateUpdater(state);
      listeners.forEach((l) => l());
    },

    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export type AppStateStore = ReturnType<typeof createAppStateStore>;
