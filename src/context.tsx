/* eslint @typescript-eslint/no-explicit-any: off */
/* eslint import/no-named-as-default-member: off */

import ReactExports from 'react';
import type { ReactNode } from 'react';

import { setOverride } from './use.js';

const {
  createContext: createContextOrig,
  useContext: useContextOrig,
  useEffect,
  useRef,
  useSyncExternalStore,
} = ReactExports;

const STORE = Symbol();

const createStore = <T,>(defaultValue: T) => {
  let value = defaultValue;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const setValue = (nextValue: T) => {
    value = nextValue;
    listeners.forEach((l) => l());
  };
  const getValue = () => value;
  return { type: STORE, subscribe, setValue, getValue };
};

const isStore = (store: any): store is ReturnType<typeof createStore> =>
  store?.type === STORE;

export const createContext: typeof createContextOrig = (<T,>(
  defaultValue: T,
) => {
  const context = createContextOrig(createStore(defaultValue));
  const ProviderOrig = context.Provider;
  const Provider = ({ value, children }: { value: T; children: ReactNode }) => {
    const storeRef = useRef<ReturnType<typeof createStore<T>>>();
    if (!storeRef.current) {
      storeRef.current = createStore(value);
    }
    const store = storeRef.current;
    useEffect(() => {
      store.setValue(value);
    });
    return <ProviderOrig value={store}>{children}</ProviderOrig>;
  };
  (context as any).Provider = Provider;
  delete (context as any).Consumer;
  return context;
}) as never;

// LIMITATION:
// - Doesn't trigger rerender if the value is unchanged
export const useContext: typeof useContextOrig = ((
  context: ReturnType<typeof createContext>,
) => {
  const store = useContextOrig(context);
  if (!isStore(store)) {
    throw new Error(
      'useContext must be used with createContext from react18-use',
    );
  }
  return useSyncExternalStore(store.subscribe, store.getValue);
}) as never;

const isEqualSet = <T,>(a: Set<T>, b: Set<T>) =>
  a.size === b.size && [...a].every((x) => b.has(x));

// LIMITATION:
// - Doesn't memoize function!!!
// - Doesn't support deps
// - Can tear?
export const useMemo = <T,>(fn: () => T, _deps?: []) => {
  type Subscribe = (cb: () => void) => () => void;
  const storeSet = new Set<ReturnType<typeof createStore>>();
  const ref = useRef<[Subscribe, typeof storeSet]>([() => () => {}, new Set()]);
  try {
    setOverride((usable) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const store = useContextOrig(usable as any);
      if (isStore(store)) {
        storeSet.add(store);
        return store.getValue() as never;
      }
      throw new Error('`use` must be used with createContext from react18-use');
    });
    const value = fn();
    if (!isEqualSet(ref.current[1], storeSet)) {
      ref.current = [
        (cb) => {
          const unsubs = new Set<() => void>();
          storeSet.forEach((store) => unsubs.add(store.subscribe(cb)));
          return () => unsubs.forEach((unsub) => unsub());
        },
        storeSet,
      ];
    }
    return useSyncExternalStore(ref.current[0], () => value);
  } finally {
    setOverride(undefined);
  }
};
