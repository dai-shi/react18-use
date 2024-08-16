/// <reference types="react/experimental" />

import ReactExports from 'react';

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

export const use =
  ReactExports.use ||
  (<T>(usable: Usable<T>): T => {
    if (isContext(usable)) {
      return ReactExports.useContext(usable);
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
  });
