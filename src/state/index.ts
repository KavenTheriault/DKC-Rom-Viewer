import { useSyncExternalStore } from 'react';
import { AppState } from './types';
import { defaultAppState } from './default';

let state = { ...defaultAppState };
const listeners: Set<() => void> = new Set();

export const getState = (): AppState => {
  return state;
};

type StateUpdater = (state: AppState) => Partial<AppState>;

export const setState = (stateUpdater: StateUpdater): void => {
  const partial = stateUpdater(state);
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

type Selector<T> = (state: AppState) => T;

export const useAppSelector = <T>(selector: Selector<T>): T => {
  return useSyncExternalStore(subscribe, () => selector(getState()));
};
