import { createContext, FC, ReactNode, useRef } from 'react';
import { defaultAppState } from './default';
import { AppState } from './types';
import { createStore, Store } from './store';

export const AppStateContext = createContext<Store<AppState> | null>(null);

export const AppStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const appStateStore = useRef<Store<AppState>>(createStore(defaultAppState));

  return (
    <AppStateContext.Provider value={appStateStore.current}>
      {children}
    </AppStateContext.Provider>
  );
};
