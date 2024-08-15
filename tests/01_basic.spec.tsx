import { expect, test } from 'vitest';
import { use } from 'react18-use';

test('should export functions', () => {
  expect(use).toBeDefined();
});
