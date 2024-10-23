import { eval_, } from "./ast"
import { Form, Expr, Symbol, isForm, isSymbol, form, sym, Types, Integer, String } from "./expr"
import { Head } from "./builtins";

export type Env = Map<Symbol, Expr>;

const HOLD_PATTERN = sym("HoldPattern");
const SYM_PATTERN = sym("Pattern");
const SYM_PATTERN_TEST = sym("PatternTest");
const SYM_BLANK = sym("Blank");
const SYM_RULE = sym("Rule");
const SYM_RULE_DELAYED = sym("RuleDelayed");

export const match = (e: Expr, p: Expr, env: Env): boolean => {
  if (e === p) {
    return true;
  }

  // Treat `HoldPattern` specially
  if (isFormHead(p, HOLD_PATTERN)) {
    p = p.parts[0];
  }

  // Match special forms
  if (isFormHead(p, SYM_BLANK)) {
    return matchBlank(e, p);
  }
  if (isFormHead(p, SYM_PATTERN)) {
    return matchPattern(e, p, env);
  }
  if (isFormHead(p, SYM_PATTERN_TEST)) {
    return matchPatternTest(e, p, env);
  }

  // No immediate patterns
  return deepEqualAtom(e, p) || matchForm(e, p, env);
}

const matchForm = (e: Expr, p: Expr, env: Env): boolean => {
  if (e.type != Types.Form || p.type != Types.Form) { return false; }
  if (e.parts.length != p.parts.length) { return false; }

  if (!match(e.head, p.head, env)) {
    return false;
  }

  for(let i = 0; i<e.parts.length; i++) {
    if (!match(e.parts[i], p.parts[i], env)) {
      return false;
    }
  }
  return true;
}

const matchBlank = (e: Expr, p: Form): boolean => {
  if (!isFormHead(p, SYM_BLANK)) {
    return false;
  }

  if (p.parts.length == 0) {
    return true;
  }

  return Head([e]) == p.parts[0];
}

const matchPattern = (e: Expr, p: Form, env: Env): boolean => {
  if (!isSymbol(p.parts[0])
    || !isForm(p.parts[1])
    || !isFormHead(p.parts[1], SYM_BLANK))
  {
    throw "ThisShouldNeverHappenException:)";
  }
  if (!matchBlank(e, p.parts[1])) {
    return false;
  }

  const k = p.parts[0];
  if (env.has(k)) {
    return deepEqual(env.get(k)!, e);
  }

  env.set(k, e);
  return true;
}

const matchPatternTest = (e: Expr, p: Form, env: Env): boolean => {
  if (!match(e, p.parts[0], env)) {
    return false;
  }

  const testForm = form(p.parts[1], [e]);
  return eval_(testForm, env) == sym('True');
}

export const replace = (expr: Expr, rules: [Expr, Expr][]): Expr | null => {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const env: Env = new Map();
    if (match(expr, rule[0], env)) {
      return eval_(rule[1], env);
    }
  }

  return null;
}

export const replaceAll = (expr: Expr,  rules: [Expr, Expr][]): Expr => {
  // try the whole expression first
  const res = replace(expr, rules);
  if (res !== null || !isForm(expr)) {
    return res !== null ? res : expr;
  }

  return form(
    replaceAll(expr.head, rules),
    expr.parts.map(part => replaceAll(part, rules)),
  );
}

export const replaceRepeated = (expr: Expr,  rules: [Expr, Expr][]): Expr => {
  let i = 0;
  while (true) {
    const expr_ = replaceAll(expr, rules);
    if (deepEqual(expr, expr_)) {
      return expr;
    } else {
      expr = expr_;
      i++;
    }
    if (i > 1000) {
      throw "Infinite recursion";
    }
  }
}

export const ruleToPair = (rule: Expr): [Expr, Expr] => {
  if (isForm(rule) && isRule(rule)) {
    return [rule.parts[0], rule.parts[1]];
  }
  throw "Expected a rule";
}

export const rulesToPairs = (rules: Expr[]) => rules.map(ruleToPair);

export const isRule = (e: Expr): e is Form =>
  isForm(e) && (e.head === SYM_RULE || e.head === SYM_RULE_DELAYED);

/*
  Deep equal
*/
const deepEqualAtom = (e1: Expr, e2: Expr): boolean => {
  if (e1 === e2) {
    return true;
  } else if (e1.type !== e2.type) {
    return false;
  } else if (e1.type === Types.Symbol) {
    return e1 == e2;
  } else if (e1.type === Types.Integer) {
    return e1.val === (e2 as Integer).val;
  } else if (e1.type === Types.String) {
    return e1.val === (e2 as String).val;
  } else {
    return false;
  }
}

const deepEqualForm = (f1: Expr, f2: Expr): boolean => {
  if (f1.type != Types.Form || f2.type != Types.Form) { return false; }
  if (f1.parts.length != f2.parts.length) { return false; }

  if (!deepEqual(f1.head, f2.head)) {
    return false;
  }

  for(let i = 0; i<f1.parts.length; i++) {
    if (!deepEqual(f1.parts[i], f2.parts[i])) {
      return false;
    }
  }
  return true;
}

const deepEqual = (e1: Expr, e2: Expr): boolean =>
  deepEqualAtom(e1, e2) || deepEqualForm(e1, e2);

const isFormHead = <T extends Symbol>(e: Expr, x: T): e is Form & { head: T } =>
  (e as Form).head === x;
