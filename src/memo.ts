import React from 'react';

import { setOverride } from './use.js';
import { getOriginalContext } from './context.js';
import type { Store } from './context.js';

const isEqualSet = <T>(a: Set<T>, b: Set<T>) =>
  a.size === b.size && [...a].every((x) => b.has(x));

// LIMITATION:
// - Doesn't support deps
// - Can tear?
export const useMemo = <T>(fn: () => T, deps: readonly unknown[]) => {
  type Subscribe = (cb: () => void) => () => void;
  const cache = React.useMemo<{
    subscribe: Subscribe;
    storeSet: Set<Store<unknown>>;
  }>(
    () => ({ subscribe: () => () => {}, storeSet: new Set() }),
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
  return React.useMemo(
    () => {
      const storeSet = new Set<Store<unknown>>();
      try {
        setOverride((usable) => {
          const originalContext = getOriginalContext(usable);
          if (!originalContext) {
            throw new Error(
              'use must be used with createContext from react18-use',
            );
          }
          const store = (React.use || React.useContext)(originalContext);
          storeSet.add(store);
          return store.getValue() as never;
        });
        const value = fn();
        if (!isEqualSet(cache.storeSet, storeSet)) {
          cache.subscribe = (cb) => {
            const unsubs = new Set<() => void>();
            storeSet.forEach((store) => unsubs.add(store.subscribe(cb)));
            return () => unsubs.forEach((unsub) => unsub());
          };
          cache.storeSet = storeSet;
        }
        // eslint-disable-next-line react-compiler/react-compiler
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return React.useSyncExternalStore(cache.subscribe, () => value);
      } finally {
        setOverride(undefined);
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
};
