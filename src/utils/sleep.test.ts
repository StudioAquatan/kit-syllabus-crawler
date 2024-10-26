import { describe, expect, it, jest } from '@jest/globals';
import { sleep } from './sleep';

jest.useFakeTimers();

describe('sleep', () => {
  it('should resolve after the given time', async () => {
    const time = 1000;
    const promise = sleep(time);
    jest.advanceTimersByTime(time);
    await expect(promise).resolves.not.toThrow();
  });
});
