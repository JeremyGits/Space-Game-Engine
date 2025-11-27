/**
 * Persist Middleware
 * 
 * Custom persistence middleware for Zustand stores
 * Handles saving and loading state from localStorage
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand';

export interface PersistOptions<T> {
  name: string;
  version?: number;
  storage?: Storage;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void;
  skipHydration?: boolean;
}

type PersistImpl = <T>(
  config: StateCreator<T>,
  options: PersistOptions<T>
) => StateCreator<T>;

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, Mps, Mcs>,
  options: PersistOptions<T>
) => StateCreator<T, Mps, Mcs>;

type PersistMiddleware = Persist extends (...args: infer Args) => infer Ret
  ? (...args: Args) => Ret
  : never;

const persistImpl: PersistImpl = (config, options) => (set, get, api) => {
  const {
    name,
    version = 1,
    storage = localStorage,
    partialize,
    onRehydrateStorage,
    skipHydration = false
  } = options;

  const storageKey = `${name}-v${version}`;

  // Load persisted state
  if (!skipHydration) {
    try {
      const persistedState = storage.getItem(storageKey);
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        set(parsed);
        console.log(`[PersistMiddleware] Rehydrated state for: ${name}`);
        
        if (onRehydrateStorage) {
          onRehydrateStorage(get());
        }
      }
    } catch (error) {
      console.error(`[PersistMiddleware] Failed to rehydrate ${name}:`, error);
    }
  }

  // Create store with persistence
  const store = config(
    (partial, replace?) => {
      set(partial, replace as any);
      
      // Save to storage after state update
      try {
        const state = get();
        const stateToPersist = partialize ? partialize(state) : state;
        storage.setItem(storageKey, JSON.stringify(stateToPersist));
      } catch (error) {
        console.error(`[PersistMiddleware] Failed to persist ${name}:`, error);
      }
    },
    get,
    api
  );

  return store;
};

export const persist = persistImpl as unknown as PersistMiddleware;

/**
 * Clear persisted state
 */
export const clearPersistedState = (name: string, version: number = 1): void => {
  const storageKey = `${name}-v${version}`;
  try {
    localStorage.removeItem(storageKey);
    console.log(`[PersistMiddleware] Cleared persisted state: ${name}`);
  } catch (error) {
    console.error(`[PersistMiddleware] Failed to clear ${name}:`, error);
  }
};

/**
 * Get persisted state
 */
export const getPersistedState = <T>(name: string, version: number = 1): T | null => {
  const storageKey = `${name}-v${version}`;
  try {
    const persistedState = localStorage.getItem(storageKey);
    if (persistedState) {
      return JSON.parse(persistedState) as T;
    }
  } catch (error) {
    console.error(`[PersistMiddleware] Failed to get persisted state ${name}:`, error);
  }
  return null;
};
