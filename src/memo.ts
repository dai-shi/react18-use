import React from 'react';

import { setOverride } from './use.js';
import { getOriginalContext } from './context.js';
import type { Store } from './context.js';

// LIMITATION:
// - Can tear?
export const useMemo = <T>(fn: () => T, deps: readonly unknown[]) => {
  type Unsubscribe = () => void;
  type Subscribe = (cb: () => void) => Unsubscribe;
  type AddStore = (store: Store<unknown>) => void;
  const cache = React.useMemo(
    () => {
      const subscriptions = new Map<Store<unknown>, Unsubscribe>();
      const storeSet = new Set<Store<unknown>>();
      let callback: (() => void) | undefined;
      const subscribe: Subscribe = (cb) => {
        callback = cb;
        for (const store of storeSet) {
          if (!subscriptions.has(store)) {
            subscriptions.set(
              store,
              store.subscribe(() => callback?.()),
            );
          }
        }
        return () => {
          callback = undefined;
          for (const unsub of subscriptions.values()) {
            unsub();
          }
          subscriptions.clear();
        };
      };
      const addStore: AddStore = (store) => {
        storeSet.add(store);
        if (callback) {
          subscriptions.set(
            store,
            store.subscribe(() => callback?.()),
          );
        }
      };
      return { subscribe, addStore };
    },
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
  return React.useSyncExternalStore(cache.subscribe, () => {
    try {
      setOverride((usable) => {
        const originalContext = getOriginalContext(usable);
        if (!originalContext) {
          throw new Error(
            'use must be used with createContext from react18-use',
          );
        }
        const store = (React.use || React.useContext)(originalContext);
        cache.addStore(store);
        return store.getValue() as never;
      });
      return fn();
    } finally {
      setOverride(undefined);
    }
  });
};
