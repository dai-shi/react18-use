import React from 'react';
import type { Context, ReactNode } from 'react';

const createStore = <T>(defaultValue: T) => {
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
  return { subscribe, setValue, getValue };
};

export type Store<T> = ReturnType<typeof createStore<T>>;

const STORE_CONTEXT = Symbol();

export const getStoreContext = <T>(context: unknown) => {
  const storeContext = (context as { [STORE_CONTEXT]?: Context<Store<T>> })[
    STORE_CONTEXT
  ];
  return storeContext;
};

export const createContext: typeof React.createContext = (<T>(
  defaultValue: T,
) => {
  const context = React.createContext(createStore(defaultValue));
  const Provider = ({ value, children }: { value: T; children: ReactNode }) => {
    const storeRef = React.useRef<Store<T>>(undefined);
    /* eslint-disable react-compiler/react-compiler */
    if (!storeRef.current) {
      storeRef.current = createStore(value);
    }
    const store = storeRef.current;
    /* eslint-enable react-compiler/react-compiler */
    React.useEffect(() => {
      store.setValue(value);
    });
    return React.createElement(context.Provider, { value: store }, children);
  };
  Provider.Provider = Provider;
  Provider[STORE_CONTEXT] = context;
  return Provider;
}) as never;

// LIMITATION:
// - Doesn't trigger rerender if the value is unchanged
export const useContext: typeof React.useContext = ((
  context: ReturnType<typeof createContext>,
) => {
  const storeContext = getStoreContext(context);
  if (!storeContext) {
    throw new Error(
      'useContext must be used with createContext from react18-use',
    );
  }
  const store = React.useContext(storeContext);
  return React.useSyncExternalStore(store.subscribe, store.getValue);
}) as never;
