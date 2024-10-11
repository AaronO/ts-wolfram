import type { parser } from './parser/base';
import { fwd } from './parser/base';
import { seq, alpha, many, alnum, nat, either, sepBy } from './parser/lib';
import { stream } from './parser/stream';

export const expr = fwd(() =>
  either(form, symbol, nat))

type form = {
  head: string,
  parts: expr[],
}

type expr = number | string | form;

const form = (source: stream) => {
  const res: parser<form> = seq(symbol, '[', sepBy(expr, ','), ']').map2((head, _, parts) =>
    ({ head, parts }));
  return res(source);
};

const symbol = seq(alpha, many(alnum)).map2((ft, rt) =>
  [ft, ...rt].join(""));

/*
  TODO:
  - In `either('foo').map(...)` the string 'foo' gets mapped to unknown.
    Should fix that.
  - If I could push infinite regress through map, it would be trivial to
    just specify the AST type in map, and avoid the trick in `form`.
*/
