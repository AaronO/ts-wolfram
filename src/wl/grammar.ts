import type { parser } from '../parser/base';
import { Int, Form, Symbol } from './ast';
import { fwd, lex } from '../parser/base';
import { seq, alpha, many, alnum, int, either, sepBy } from '../parser/lib';
import { stream } from '../parser/stream';

export const expr = fwd(() =>
  either(form, symbol, integer));

const form = (source: stream) => {
  const res: parser<Form> = seq(symbol, '[', sepBy(expr, ','), ']').map2<Form>((head, _, parts) =>
    new Form(head, parts));
  return res(source);
}

const symbol = lex(seq(alpha, many(alnum)).map2<Symbol>((ft, rt) =>
  new Symbol([ft, ...rt].join(""))));


const integer = int.map<Int>(val =>
  new Int(val));

