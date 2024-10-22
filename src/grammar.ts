import { Integer, Form, Expr, isInteger,
  sym, list, form, int, str
 } from './expr';
import {
  seq, alpha, many, alnum, nat, either, sepBy,
  binop, binopr, stream, fwd, lex, parser, not,
  peek, maybe, some, anych
} from '@spakhm/ts-parsec';

/*
  Grammar entry point.
*/
export const expr = fwd(() => compoundExpr);

/*
  Operators: replace, rule, assignments, terms, factors, exponents
*/
const compoundExpr = fwd(() => seq(assignment, many(seq(';', assignment).map2((_, e) => e)), maybe(';')).map2((e, es, t) => {
  if (es.length == 0 && !t) return e;
  return form(sym("CompoundExpression"), [e, ...es, ...(t ? [sym("Null")] : [])])
}));

const assignment = fwd(() => binopr(either('=', ':='), replace, (op, l, r: Expr): Form =>
  form(sym(op == '=' ? 'Set' : 'SetDelayed'), [l, r])));

const replace = fwd(() => binop(either('/.', '//.'), rule, (op, l: Expr, r): Form =>
  form(sym(op == '/.' ? 'ReplaceAll' : 'ReplaceRepeated'), [l, r])));

const rule = fwd(() => binopr(either('->', ':>'), term, (op, l, r: Expr): Form =>
  form(sym(op == '->' ? 'Rule' : 'RuleDelayed'), [l, r])));

const term = fwd(() => binop(either('+', '-'), factor, (op, l: Expr, r): Form => {
  let right: Expr = r;
  if (op == '-') {
    if (isInteger(right)) {
      right.val = -right.val;
    } else {
      right = form(sym('Times'), [int(-1), right]);
    }
  }
  return form(sym('Plus'), [l, right]);
}));

const factor = fwd(() => binop(either('*', '/', peek(not(either('+', '-')))), exponent, (op, l: Expr, r): Form =>
  form(sym('Times'), [l, (op == '*' || op == null) ? r : form(
    sym('Power'), [r, int(-1)])])));

const exponent = fwd(() => binopr('^', concat, (_, l, r: Expr): Form =>
  form(sym('Power'), [l, r])));

const concat = fwd(() => binop('<>', ptest, (_, l: Expr, r): Form =>
  form(sym('StringJoin'), [l, r])));
    
const ptest = fwd(() => binopr(either('?'), unaryMinus, (_, l, r: Expr): Form =>
  form(sym('PatternTest'), [l, r])));

const unaryMinus = fwd(() => seq(many(either('-', '+')), literal).map2((signs, expr) => {
  signs = signs.filter(s => s != '+');
  if (signs.length % 2 == 0) {
    return expr;
  } else {
    return form(sym("Minus"), [expr]);
  }
}));

/*
  Literals (forms & non-forms)
*/
const literal = fwd(() => either(form_, nonFormLiteral));

/*
  Forms
*/
const form_ = fwd(() => seq(nonFormLiteral, some(formTail)).map2<Form>((head, tails) =>
  tails.slice(1).reduce((acc, tail) =>
    form(acc, tail), form(head, tails[0]))));

const formTail = (source: stream) => {
  const p: parser<Expr[]> = seq('[', sepBy(expr, ','), ']').map2((_, parts) => parts);
  return p(source);
}

/*
  Non-forms: (expr), lists, patterns, blanks, symbols, integers
*/
const nonFormLiteral = fwd(() => either(paren_expr, list_expr, pattern, blank, symbol_, integer, string_));

const paren_expr = (source: stream) => {
  const p: parser<Expr> = seq('(', expr, ')').map2((_, e) => e);
  return p(source);
}

const list_expr = (source: stream) => {
  const res: parser<Form> = seq('{', sepBy(expr, ','), '}').map2<Form>((_, els) => list(els));
  return res(source);
}

const pattern = fwd(() => lex(seq(symbol_, blank).map2((s, b) =>
  form(sym('Pattern'), [s, b]))));

const blank = fwd(() => lex(seq('_', maybe(symbol_)).map2((_, s) =>
  form(sym('Blank'), s ? [s] : []))));

const symbol_ = lex(seq(alpha, many(alnum)).map2((ft, rt) =>
  sym([ft, ...rt].join(""))));

const string_ = lex(seq('"', many(seq(not(peek('"')), anych).map2((_, c) => c)), '"').map2((_, cs) =>
  str(cs.join(""))));

const integer = nat.map<Integer>(val =>
  int(val));
