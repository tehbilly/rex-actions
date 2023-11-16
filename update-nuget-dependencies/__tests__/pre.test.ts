/**
 * Unit tests for the action's pre entrypoint, src/pre.ts
 */

import * as pre from '../src/pre';

// Mock the action's entrypoint
const runMock = jest.spyOn(pre, 'pre').mockImplementation();

describe('pre', () => {
  it('calls pre when imported', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../src/pre');

    expect(runMock).toHaveBeenCalled();
  });
});
