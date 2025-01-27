import React from 'react';

import { getStoreContext } from './context.js';

type Usable<T> =
  | (PromiseLike<T> & {
      status?: 'pending' | 'fulfilled' | 'rejected';
      value?: T;
      reason?: unknown;
    })
  | React.Context<T>;

function isContext<T>(usable: Usable<T>): usable is React.Context<T> {
  return '_currentValue' in usable && '$$typeof' in usable;
}

let override: (<T>(usable: Usable<T>) => T) | undefined;
export const setOverride = (fn: typeof override) => {
  override = fn;
};

export const use = React.use
  ? <T>(usable: Usable<T>): T => {
      if (override) {
        return override(usable);
      }
      const storeContext = getStoreContext<T>(usable);
      if (storeContext) {
        const store = React.use(storeContext);
        return React.useSyncExternalStore(store.subscribe, store.getValue);
      }
      return React.use(usable);
    }
  : <T>(usable: Usable<T>): T => {
      if (override) {
        return override(usable);
      }
      const storeContext = getStoreContext<T>(usable);
      if (storeContext) {
        const store = React.useContext(storeContext);
        return React.useSyncExternalStore(store.subscribe, store.getValue);
      }
      if (isContext(usable)) {
        return React.useContext(usable);
      }
      if (usable.status === 'pending') {
        throw usable;
      } else if (usable.status === 'fulfilled') {
        return usable.value as T;
      } else if (usable.status === 'rejected') {
        throw usable.reason;
      } else {
        usable.status = 'pending';
        usable.then(
          (v) => {
            usable.status = 'fulfilled';
            usable.value = v;
          },
          (e) => {
            usable.status = 'rejected';
            usable.reason = e;
          },
        );
        throw usable;
      }
    };
