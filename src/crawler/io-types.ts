import { either } from 'fp-ts/Either';
import * as t from 'io-ts';

export const NonNaNNumber = new t.Type<number, number, unknown>(
  'NonNaNNumber',
  (u: unknown): u is number => t.number.is(u) && !isNaN(u),
  (u, c) =>
    either.chain(t.number.validate(u, c), (s) => {
      return isNaN(s) ? t.failure(null, c, 'NaN number') : t.success(s);
    }),
  t.identity,
);
