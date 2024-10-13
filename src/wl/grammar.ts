import type { parser } from '../parser/base';
import { Int, Form, Symbol, Expr } from './ast';
import { fwd, lex } from '../parser/base';
import { seq, alpha, many, alnum, int, either, sepBy, binop } from '../parser/lib';
import { stream } from '../parser/stream';

export const expr = fwd(() => binop(either('+', '-'), term, (op, l: Expr, r): Form =>
  new Form(new Symbol(op == '+' ? 'Plus' : 'Minus'), [l, r])));

const term = fwd(() => binop(either('*', '/'), factor, (op, l: Expr, r): Form =>
  new Form(new Symbol(op == '*' ? 'Times' : 'Div'), [l, r])));

const factor = fwd(() => either(symbol, integer, form, paren_expr));

const paren_expr = (source: stream) => {
  const p: parser<Expr> = seq('(', expr, ')').map2((_, e) => e);
  return p(source);
}

const form = (source: stream) => {
  const res: parser<Form> = seq(symbol, '[', sepBy(expr, ','), ']').map2<Form>((head, _, parts) =>
    new Form(head, parts));
  return res(source);
}

const symbol = lex(seq(alpha, many(alnum)).map2<Symbol>((ft, rt) =>
  new Symbol([ft, ...rt].join(""))));

const integer = int.map<Int>(val =>
  new Int(val));
