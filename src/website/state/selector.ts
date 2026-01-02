import { useContext, useRef, useSyncExternalStore } from 'react';
import { AppState } from './types';
import { AppStateContext } from './state-provider';
import { Store } from './store';

export const useAppStore = (): Store<AppState> => {
  const store = useContext(AppStateContext);
  if (!store) {
    throw new Error('stateSelector must be used inside AppStateProvider');
  }
  return store;
};

export const stateSelector = <T>(
  selector: (state: AppState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
) => {
  const store = useAppStore();
  const selectedRef = useRef<T>(selector(store.get()));

  return useSyncExternalStore(store.subscribe, () => {
    const nextSelected = selector(store.get());

    if (!isEqual(selectedRef.current, nextSelected)) {
      selectedRef.current = nextSelected;
    }

    return selectedRef.current;
  });
};
