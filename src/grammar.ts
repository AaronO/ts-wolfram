import { Int, Form, Symbol, Expr } from './ast';
import {
  seq, alpha, many, alnum, int, either, sepBy,
  binop, binopr, stream, fwd, lex, parser
} from '@spakhm/ts-parsec';

export const expr = fwd(() => assignment);

const assignment = fwd(() => binopr(either('=', ':='), term, (op, l, r: Expr): Form =>
  new Form(new Symbol(op == '=' ? 'Set' : 'SetDelayed'), [l, r])));

const term = fwd(() => binop(either('+', '-'), factor, (op, l: Expr, r): Form => {
  let right: Expr = r;
  if (op == '-') {
    if (right instanceof Int) {
      right.val = -right.val;
    } else {
      right = new Form(new Symbol('Times'), [new Int(-1), right]);
    }
  }
  return new Form(new Symbol('Plus'), [l, right]);
}));

const factor = fwd(() => binop(either('*', '/'), exponent, (op, l: Expr, r): Form =>
  new Form(new Symbol('Times'), [l, op == '*' ? r : new Form(
    new Symbol('Power'), [r, new Int(-1)])])));

const exponent = fwd(() => binop(either('^'), primitive, (_, l: Expr, r): Form =>
  new Form(new Symbol('Power'), [l, r])));

const primitive = fwd(() => either(paren_expr, symbol, integer, form));

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
