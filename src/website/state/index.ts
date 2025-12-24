import { useSyncExternalStore } from 'react';
import { AppState } from './types';
import { defaultAppState } from './default';
import { DeepPartial } from '../types/deep-partial';
import { merge } from 'lodash';

let state = { ...defaultAppState };
const listeners: Set<() => void> = new Set();

export const getState = (): AppState => {
  return state;
};

type StateUpdater = (state: AppState) => DeepPartial<AppState>;

export const setState = (stateUpdater: StateUpdater): void => {
  const updatedEntries = stateUpdater(state);
  state = merge({}, state, updatedEntries);
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
