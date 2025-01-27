# react18-use

[![CI](https://img.shields.io/github/actions/workflow/status/dai-shi/react18-use/ci.yml?branch=main)](https://github.com/dai-shi/react18-use/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/react18-use)](https://www.npmjs.com/package/react18-use)
[![size](https://img.shields.io/bundlephobia/minzip/react18-use)](https://bundlephobia.com/result?p=react18-use)
[![discord](https://img.shields.io/discord/627656437971288081)](https://discord.gg/MrQdmzd)

React 19 use hook shim

## Motivation

While waiting for React 19, I still want to release a library that depends on React 19 use hook. Hense, this shim.

It also provides useMemo + use(Context) experimental feature, which we hope to have in React 19. (See: https://x.com/TkDodo/status/1741193371283026422 )

## Install

```bash
npm install react18-use
```

## Usage

### Promise

It works both in React 18 and React 19. However, you don't need it if you are using React 19.

```tsx
import { Suspense, useState } from 'react';
import { use } from 'react18-use';

const Counter = ({ countPromise }: { countPromise: Promise<number> }) => {
  const count = use(countPromise);
  return <p>Count: {count}</p>;
};

const App = () => {
  const [countPromise, setCountPromise] = useState(Promise.resolve(0));
  return (
    <div>
      <button
        onClick={() =>
          setCountPromise(async (prev) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return (await prev) + 1;
          })
        }
      >
        +1
      </button>
      <Suspense fallback={<p>Loading...</p>}>
        <Counter countPromise={countPromise} />
      </Suspense>
    </div>
  );
};
```

### Context

It works both in React 18 and React 19.

```tsx
import { useState } from 'react';
import type { ReactNode } from 'react';
import { createContext, use, useMemo } from 'react18-use';

const MyContext = createContext({ foo: '', count: 0 });

const Component = () => {
  const foo = useMemo(() => {
    const { foo } = use(MyContext);
    return foo;
  }, []);
  return (
    <p>
      Foo: {foo} ({Math.random()})
    </p>
  );
};

const MyProvider = ({ children }: { children: ReactNode }) => {
  const [count, setCount] = useState(1);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <MyContext.Provider value={{ foo: 'React', count }}>
        {children}
      </MyContext.Provider>
    </div>
  );
};

const App = () => (
  <MyProvider>
    <Component />
  </MyProvider>
);
```

## Limitations

- Only supports promises and contexts.
- It might not work exactly the same as React 19.
- useMemo with use(Context) is experimental (feedback welcome).

## Examples

The [examples](examples) folder contains working examples.
You can run one of them with

```bash
PORT=8080 pnpm run examples:01_counter
```

and open <http://localhost:8080> in your web browser.

You can also try them directly:
[01](https://stackblitz.com/github/dai-shi/react18-use/tree/main/examples/01_counter)
[02](https://stackblitz.com/github/dai-shi/react18-use/tree/main/examples/02_context)

## Tweets

- https://x.com/dai_shi/status/1823896762542928373
- https://x.com/dai_shi/status/1824424680721354980
- https://x.com/dai_shi/status/1825484689030955094
- https://x.com/dai_shi/status/1883730673091117386
