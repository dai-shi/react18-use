# react18-use

[![CI](https://img.shields.io/github/actions/workflow/status/dai-shi/react18-use/ci.yml?branch=main)](https://github.com/dai-shi/react18-use/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/react18-use)](https://www.npmjs.com/package/react18-use)
[![size](https://img.shields.io/bundlephobia/minzip/react18-use)](https://bundlephobia.com/result?p=react18-use)
[![discord](https://img.shields.io/discord/627656437971288081)](https://discord.gg/MrQdmzd)

React 19 use hook shim

## Motivation

While waiting for React 19, I still want to release a library that depends on React 19 use hook. Hense, this shim.

## Install

```bash
npm install react18-use
```

## Usage

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

## Limitations

- Only supports promises and contexts.
- It might not work the same as React 19.

## Examples

The [examples](examples) folder contains working examples.
You can run one of them with

```bash
PORT=8080 pnpm run examples:01_counter
```

and open <http://localhost:8080> in your web browser.

You can also try them directly:
[01](https://stackblitz.com/github/dai-shi/react18-use/tree/main/examples/01_counter)

## Tweets

- https://x.com/dai_shi/status/1823896762542928373
- https://x.com/dai_shi/status/1824424680721354980
