import { Int, Form, Expr } from './ast';
import {
  seq, alpha, many, alnum, nat, either, sepBy,
  binop, binopr, stream, fwd, lex, parser, not,
  peek, maybe, some
} from '@spakhm/ts-parsec';
import { symbol } from './symbols';
import { list } from './list';

/*
  Grammar entry point.
*/
export const expr = fwd(() => assignment);

/*
  Operators: replace, rule, assignments, terms, factors, exponents
*/
const assignment = fwd(() => binopr(either('=', ':='), replace, (op, l, r: Expr): Form =>
  new Form(symbol(op == '=' ? 'Set' : 'SetDelayed'), [l, r])));

const replace = fwd(() => binop(either('/.', '//.'), rule, (op, l: Expr, r): Form =>
  new Form(symbol(op == '/.' ? 'ReplaceAll' : 'ReplaceRepeated'), [l, r])));

const rule = fwd(() => binopr(either('->', ':>'), term, (op, l, r: Expr): Form =>
  new Form(symbol(op == '->' ? 'Rule' : 'RuleDelayed'), [l, r])));

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

const factor = fwd(() => binop(either('*', '/', peek(not(either('+', '-')))), exponent, (op, l: Expr, r): Form =>
  new Form(symbol('Times'), [l, (op == '*' || op == null) ? r : new Form(
    symbol('Power'), [r, new Int(-1)])])));

const exponent = fwd(() => binopr(either('^'), ptest, (_, l, r: Expr): Form =>
  new Form(symbol('Power'), [l, r])));

const ptest = fwd(() => binopr(either('?'), unaryMinus, (_, l, r: Expr): Form =>
  new Form(symbol('PatternTest'), [l, r])));

const unaryMinus = fwd(() => seq(many(either('-', '+')), literal).map2((signs, expr) => {
  signs = signs.filter(s => s != '+');
  if (signs.length % 2 == 0) {
    return expr;
  } else {
    return new Form(symbol("Minus"), [expr]);
  }
}));

/*
  Literals (forms & non-forms)
*/
const literal = fwd(() => either(form, nonFormLiteral));

/*
  Forms
*/
const form = fwd(() => seq(nonFormLiteral, some(formTail)).map2<Form>((head, tails) =>
  tails.slice(1).reduce((acc, tail) =>
    new Form(acc, tail), new Form(head, tails[0]))));

const formTail = (source: stream) => {
  const p: parser<Expr[]> = seq('[', sepBy(expr, ','), ']').map2((_, parts) => parts);
  return p(source);
}

/*
  Non-forms: (expr), lists, patterns, blanks, symbols, integers
*/
const nonFormLiteral = fwd(() => either(paren_expr, list_expr, pattern, blank, symbol_, integer));

const paren_expr = (source: stream) => {
  const p: parser<Expr> = seq('(', expr, ')').map2((_, e) => e);
  return p(source);
}

const list_expr = (source: stream) => {
  const res: parser<Form> = seq('{', sepBy(expr, ','), '}').map2<Form>((_, els) => list(els));
  return res(source);
}

const pattern = fwd(() => lex(seq(symbol_, blank).map2((s, b) =>
  new Form(symbol('Pattern'), [s, b]))));

const blank = fwd(() => lex(seq('_', maybe(symbol_)).map2((_, s) =>
  new Form(symbol('Blank'), s ? [s] : []))));

const symbol_ = lex(seq(alpha, many(alnum)).map2((ft, rt) =>
  symbol([ft, ...rt].join(""))));

const integer = nat.map<Int>(val =>
  new Int(val));
