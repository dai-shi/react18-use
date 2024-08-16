import { Suspense, useState, createContext } from 'react';
import { use } from 'react18-use';

const messageContext = createContext('hello world');

const Counter = ({ countPromise }: { countPromise: Promise<number> }) => {
  const count = use(countPromise);
  return <p>Count: {count}</p>;
};

const App = () => {
  const [countPromise, setCountPromise] = useState(Promise.resolve(0));
  const message = use(messageContext);
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
      <p>{message} from context!</p>
    </div>
  );
};

export default App;
