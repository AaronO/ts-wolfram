import { Symbol, Expr, isSymbol, isForm, form, sym } from './expr';
import { attrs } from './attrs';
import { isRule } from './rewrite';

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
  let sym_: Symbol;
  if (isSymbol(lhs)) {
    values = ownValues;
    sym_ = lhs;
  } else if (isForm(lhs) && isSymbol(lhs.head)) {
    values = downValues;
    sym_ = lhs.head;
  } else {
    throw "Symbol or form expected";
  }

  if (shouldCheckProtected && attrs(sym_).includes(sym("Protected"))) {
    throw "Can't modify protected symbol";
  }

  const newRule = form(sym('RuleDelayed'), [
    form(sym('HoldPattern'), [lhs]),
    rhs,
  ]);
  values.set(sym_, withRule(values.get(sym_) || [], newRule));
}

const withRule = (rules: Expr[], newRule: Expr): Expr[] => {
  rules = [...rules];
  if (!isRule(newRule)) { throw "Rules expected"; }

  return [...rules, newRule];
}
