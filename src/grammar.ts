import type { parser } from './parser/base';
import { int, type form, type symbol_ } from './ast';
import { fwd } from './parser/base';
import { seq, alpha, many, alnum, nat, either, sepBy } from './parser/lib';
import { stream } from './parser/stream';

export const expr = fwd(() =>
  either(form, symbol, int))

const form = (source: stream) => {
  const res: parser<form> = seq(symbol, '[', sepBy(expr, ','), ']').map2<form>((head, _, parts) =>
    ({ type: 'form', head, parts }));
  return res(source);
};

const symbol = seq(alpha, many(alnum)).map2<symbol_>((ft, rt) => ({
  type: 'symbol',
  value: [ft, ...rt].join(""),
}));

const int = nat.map<int>(value => ({
  type: 'int',
  value,
}));

/*
  TODO:
  - In `either('foo').map(...)` the string 'foo' gets mapped to unknown.
    Should fix that.
  - If I could push infinite regress through map, it would be trivial to
    just specify the AST type in map, and avoid the trick in `form`.
*/
