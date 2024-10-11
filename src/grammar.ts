import { ok, fwd } from './parser/base';
import { seq, alpha, many, alnum, nat, either } from './parser/lib';
import { stream } from './parser/stream';

export const expr = fwd(() =>
  either(form, symbol, nat))

const form = (_source: stream) => ok('');

const symbol = seq(alpha, many(alnum)).map2((ft, rt) =>
  [ft, ...rt].join(""));
