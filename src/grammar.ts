import { Int, Form, Expr } from './ast';
import {
  seq, alpha, many, alnum, int, either, sepBy,
  binop, binopr, stream, fwd, lex, parser
} from '@spakhm/ts-parsec';
import { symbol } from './symbols';

export const expr = fwd(() => assignment);

const assignment = fwd(() => binopr(either('=', ':='), term, (op, l, r: Expr): Form =>
  new Form(symbol(op == '=' ? 'Set' : 'SetDelayed'), [l, r])));

const term = fwd(() => binop(either('+', '-'), factor, (op, l: Expr, r): Form => {
  let right: Expr = r;
  if (op == '-') {
    if (right instanceof Int) {
      right.val = -right.val;
    } else {
      right = new Form(symbol('Times'), [new Int(-1), right]);
    }
  }
  return new Form(symbol('Plus'), [l, right]);
}));

const factor = fwd(() => binop(either('*', '/'), exponent, (op, l: Expr, r): Form =>
  new Form(symbol('Times'), [l, op == '*' ? r : new Form(
    symbol('Power'), [r, new Int(-1)])])));

const exponent = fwd(() => binopr(either('^'), primitive, (_, l, r: Expr): Form =>
  new Form(symbol('Power'), [l, r])));

const primitive = fwd(() => either(paren_expr, form, atom));
const atom = fwd(() => either(symbol_, integer));

const paren_expr = (source: stream) => {
  const p: parser<Expr> = seq('(', expr, ')').map2((_, e) => e);
  return p(source);
}

const form = (source: stream) => {
  const res: parser<Form> = seq(atom, '[', sepBy(expr, ','), ']').map2<Form>((head, _, parts) =>
    new Form(head, parts));
  return res(source);
}

const symbol_ = lex(seq(alpha, many(alnum)).map2((ft, rt) =>
  symbol([ft, ...rt].join(""))));

const integer = int.map<Int>(val =>
  new Int(val));
