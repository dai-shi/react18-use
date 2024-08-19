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

export default App;
