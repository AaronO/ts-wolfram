import { seq, alpha, many, alnum, sepBy, nat, either } from './parser/lib';

const symbol = seq(alpha, many(alnum)).map(chs => [chs[0], ...chs[1]].join(""));

const expr = either(symbol, nat);

export const form = seq(symbol, '[',
  sepBy(expr, ','),
  ']'
).map(val => {
  const [head,,parts,] = val;
  return {
    head, parts,
  }
});
