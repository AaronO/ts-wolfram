import type { parser } from '../parser/base';
import { Int, Form, Symbol } from './ast';
import { fwd, lex } from '../parser/base';
import { seq, alpha, many, alnum, nat, either, sepBy } from '../parser/lib';
import { stream } from '../parser/stream';

export const expr = fwd(() =>
  either(form, symbol, int))

const form = (source: stream) => {
  const res: parser<Form> = seq(symbol, '[', sepBy(expr, ','), ']').map2<Form>((head, _, parts) =>
    new Form(head, parts));
  return res(source);
};

const symbol = lex(seq(alpha, many(alnum)).map2<Symbol>((ft, rt) =>
  new Symbol([ft, ...rt].join(""))));

const int = nat.map<Int>(val =>
  new Int(val));
