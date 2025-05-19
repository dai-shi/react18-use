import React from 'react';

import { setOverride } from './use.js';
import { getStoreContext } from './context.js';
import type { Store } from './context.js';

// LIMITATION:
// - Can tear?
export const useMemo = <T>(fn: () => T, deps: readonly unknown[]) => {
  type Unsubscribe = () => void;
  type Subscribe = (cb: () => void) => Unsubscribe;
  type StoreContext = NonNullable<ReturnType<typeof getStoreContext>>;
  type GetStore = (storeContext: StoreContext) => Store<unknown>;
  const cache = React.useMemo(
    () => {
      const subscriptions = new Map<Store<unknown>, Unsubscribe>();
      const storeMap = new Map<StoreContext, Store<unknown>>();
      let callback: (() => void) | undefined;
      const subscribe: Subscribe = (cb) => {
        callback = cb;
        for (const store of storeMap.values()) {
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
      const getStore: GetStore = (storeContext) => {
        if (storeMap.has(storeContext)) {
          return storeMap.get(storeContext)!;
        }
        const store = (React.use || React.useContext)(storeContext);
        storeMap.set(storeContext, store);
        if (callback && !subscriptions.has(store)) {
          subscriptions.set(
            store,
            store.subscribe(() => callback?.()),
          );
        }
        return store;
      };
      return { subscribe, getStore };
    },
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
  return React.useSyncExternalStore(cache.subscribe, () => {
    try {
      setOverride((usable) => {
        const storeContext = getStoreContext(usable);
        if (!storeContext) {
          throw new Error(
            'use must be used with createContext from react18-use',
          );
        }
        const store = cache.getStore(storeContext);
        return store.getValue() as never;
      });
      return fn();
    } finally {
      setOverride(undefined);
    }
  });
};
