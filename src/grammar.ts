import { toParser } from './parser/base';
import { seq, alpha, many, alnum, sepBy, nat, either } from './parser/lib';

const form_ = () => seq(symbol, '[',
  sepBy(expr, ','),
  ']'
).map(val => {
  const [head,,parts,] = val;
  return {
    head, parts,
  }
});

const symbol = () => seq(alpha, many(alnum)).map(chs =>
  [chs[0], ...chs[1]].join(""));

const expr = () => either(symbol, nat);

export const form = toParser(form_);
