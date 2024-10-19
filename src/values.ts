import { Symbol, Expr, Form } from './ast';
import { attrs } from './attrs';
import { isRule } from './rewrite';
import { symbol } from './symbols';

export const ownValues: Map<Symbol, Expr[]> = new Map();
export const downValues: Map<Symbol, Expr[]> = new Map();

let shouldCheckProtected = true;

export const withUnprotected = (fn: (() => unknown)) => {
  shouldCheckProtected = false;
  const res = fn();
  shouldCheckProtected = true;
  return res;
}

export const assign = (lhs: Expr, rhs: Expr) => {
  let values: Map<Symbol, Expr[]>;
  let sym: Symbol;
  if (lhs instanceof Symbol) {
    values = ownValues;
    sym = lhs;
  } else if (lhs instanceof Form && lhs.head instanceof Symbol) {
    values = downValues;
    sym = lhs.head;
  } else {
    throw "Symbol or form expected";
  }

  if (shouldCheckProtected && attrs(sym).includes(symbol("Protected"))) {
    throw "Can't modify protected symbol";
  }

  const newRule = new Form(symbol('RuleDelayed'), [
    new Form(symbol('HoldPattern'), [lhs]),
    rhs,
  ]);
  values.set(sym, withRule(values.get(sym) || [], newRule));
}

const withRule = (rules: Expr[], newRule: Expr): Expr[] => {
  rules = [...rules];
  if (!isRule(newRule)) { throw "Rules expected"; }

  return [...rules, newRule];
}
