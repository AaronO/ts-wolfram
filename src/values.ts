import { Symbol, Expr, Form } from './ast';
import { attrs } from './attrs';
import { isRule } from './rewrite';
import { symbol } from './symbols';

export const ownValues: Map<Symbol, Expr[]> = new Map();
export const downValues: Map<Symbol, Expr[]> = new Map();

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

  if (attrs(sym).includes(symbol("Protected"))) {
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

  if (rules.length == 0) {
    return [newRule];
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!isRule(rule)) { throw "Rules expected"; }

    const res = comparedPatterns(newRule.parts[i], rule.parts[i]);
    if (res == -1) {
      // new rule goes before the one we're visiting
      rules.splice(i, 0, newRule)
      return rules;
    } else if (res == 0) {
      // new rule replaces the one we're visiting
      rules.splice(i, 1, newRule)
      return rules;
    }
  }

  // new rule goes at the end
  rules.push(newRule);
  return rules;
}

const comparedPatterns = (p1: Expr, p2: Expr) => {
  return 1;
}