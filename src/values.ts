import { Symbol, Expr, Form } from './ast';
import { attrs } from './attrs';
import { isRule, isBlank, isPattern, isPatternTest } from './rewrite';
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

    const res = compareSpecificity(newRule.parts[i], rule.parts[i]);
    if (res == Specificity.LeftMoreSpecific) {
      rules.splice(i, 0, newRule)
      return rules;
    } else if (res == Specificity.Incomparable && shouldOverwrite(rule, newRule)) {
      rules.splice(i, 1, newRule)
      return rules;
    }
  }

  rules.push(newRule);
  return rules;
}

enum Specificity {
  LeftMoreSpecific,
  RightMoreSpecific,
  Incomparable,
}

const compareSpecificity = (p1: Expr, p2: Expr): Specificity => {
  // Treat `HoldPattern` specially; we do this here because for some reason
  // one expression may be wrapped in `HoldPattern`, while the other may
  // not be.
  if (p1 instanceof Form && p1.head instanceof Symbol && p1.head.val == 'HoldPattern') {
    p1 = p1.parts[0];
  }
  if (p2 instanceof Form && p2.head instanceof Symbol && p2.head.val == 'HoldPattern') {
    p2 = p2.parts[0];
  }

  if (isPatternlike(p1) || isPatternlike(p2)) {
    return comparePatterns(p1, p2);
  }

  if (isForm(p1) && isForm(p2)) {
    const es1 = [p1.head, ...p1.parts];
    const es2 = [p2.head, ...p2.parts];
    for (let i=0; i< es1.length; i++) {
      const res = compareSpecificity(es1[i], es2[i]);
      if (res == Specificity.LeftMoreSpecific || res == Specificity.RightMoreSpecific) {
        return res;
      }
    }
    return Specificity.Incomparable;
  }

  return Specificity.Incomparable;
}

const isPatternlike = (e: Expr) => isBlank(e) || isPattern(e) || isPatternTest(e);

const comparePatterns = (p1: Expr, p2: Expr): Specificity => {
  if (!isPatternlike(p1) && isPatternlike(p2)) { return Specificity.LeftMoreSpecific; }
  if (isPatternlike(p1) && !isPatternlike(p2)) { return Specificity.RightMoreSpecific; }

  if (isPatternTest(p1) && !isPatternTest(p2)) { return Specificity.LeftMoreSpecific; }
  if (!isPatternTest(p1) && isPatternTest(p2)) { return Specificity.RightMoreSpecific; }

  return Specificity.Incomparable;
}

const isForm = (e: Expr): e is Form => e instanceof Form;

const shouldOverwrite = (oldRule: Expr, newRule: Expr) => {
  // TODO: implement
  return false;
}