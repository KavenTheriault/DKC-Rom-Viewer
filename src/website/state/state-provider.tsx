import { cloneDeep } from 'lodash';
import { createContext, FC, ReactNode, useRef } from 'react';
import { defaultAppState } from './default';
import { AppStateStore, createAppStateStore } from './store';

export const AppStateContext = createContext<AppStateStore | null>(null);

export const AppStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const appStateStore = useRef<AppStateStore>(
    createAppStateStore(cloneDeep(defaultAppState)),
  );

  return (
    <AppStateContext.Provider value={appStateStore.current}>
      {children}
    </AppStateContext.Provider>
  );
};
