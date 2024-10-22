import { Form, Expr, Symbol, eval_, isForm, isSymbol, isInteger, isString, form, sym } from "./ast"
import { Head } from "./builtins";

export type Env = Map<Symbol, Expr>;

export const match = (e: Expr, p: Expr): [boolean, Env] => {
  let env: Env = new Map();

  // Treat `HoldPattern` specially
  if (isForm(p) && isSymbol(p.head, "HoldPattern")) {
    p = p.parts[0];
  }

  // match patterns first
  if (isForm(p) && isBlank(p)) {
    return [matchBlank(e, p), env];
  }
  if (isForm(p) && isPattern(p)) {
    return matchPattern(e, p);
  }

  if (isForm(p) && isPatternTest(p)) {
    return matchPatternTest(e, p);
  }

  // The rest is essentially deepEqual
  if (isInteger(e) && isInteger(p)) {
    return [p.val == e.val, env];
  }
  
  if (isString(e) && isString(p)) {
    return [p.val == e.val, env];
  }
  
  if (isSymbol(e) && isSymbol(p)) {
    return [p == e, env];
  }
  
  if (isForm(e) && isForm(p)) {
    if (e.parts.length != p.parts.length) { return [false, env]; }

    // Dup code for head and parts. This is by design. Originally
    // I made a new array of [head, parts] and ran the loop over
    // it. But this code is in inner loops, so array allocation
    // here is very costly.
    const [matchesp, env_] = match(e.head, p.head);
    if (!matchesp || !mergeEnv(env, env_)) { return [false, env]; }

    for(let i = 0; i<e.parts.length; i++) {
      const [matchesp, env_] = match(e.parts[i], p.parts[i]);
      if (!matchesp || !mergeEnv(env, env_)) { return [false, env]; }
    }
    return [true, env];
  }

  return [false, env];
}

export const isBlank = (e: Expr) =>
  isForm(e) && isSymbol(e.head, "Blank");

const matchBlank = (e: Expr, p: Form): boolean => {
  if (!isSymbol(p.head, "Blank")) {
    return false;
  }

  if (p.parts.length == 0) {
    return true;
  }

  return Head([e]) == p.parts[0];
}

export const isPattern = (e: Expr) =>
  isForm(e) && isSymbol(e.head, "Pattern");

const matchPattern = (e: Expr, p: Form): [boolean, Env] => {
  const env: Env = new Map();
  if (!isSymbol(p.parts[0])
    || !isForm(p.parts[1])
    || !isBlank(p.parts[1]))
  {
    throw "ThisShouldNeverHappenException:)";
  }
  if (!matchBlank(e, p.parts[1])) {
    return [false, env];
  }

  env.set(p.parts[0], e);
  return [true, env];
}

export const isPatternTest = (e: Expr) =>
  isForm(e) && isSymbol(e.head, "PatternTest");

const matchPatternTest = (e: Expr, p: Form): [boolean, Env] => {
  const [matchedp, env] = match(e, p.parts[0]);
  if (!matchedp) {
    return [false, env];
  }

  const testForm = form(p.parts[1], [e]);
  const passedp = eval_(testForm, env) == sym('True');

  return [passedp, env];
}

const mergeEnv = (acc: Env, mergee: Env): boolean => {
  for (const k of Array.from(mergee.keys())) {
    const v = mergee.get(k)!;
    if (acc.has(k)) {
      const [matches] = match(acc.get(k)!, v);
      if (!matches) {
        return false;
      }
    } else {
      acc.set(k,v);
    }
  }

  return true;
}

export const replace = (expr: Expr, rules: [Expr, Expr][]): [boolean, Expr] => {
  for (const [lhs, rhs] of rules) {
    const [matchesp, env] = match(expr, lhs);
    if (matchesp) {
      return [true, eval_(rhs, env)];
    }
  }

  return [false, expr];
}

export const replaceAll = (expr: Expr,  rules: [Expr, Expr][]): Expr => {
  // try the whole expression first
  const [replacedp, res] = replace(expr, rules);
  if (replacedp || !isForm(expr)) {
    return res;
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
    const [matchesp] = match(expr, expr_);
    if (matchesp) {
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
  isForm(e) && isSymbol(e.head) && ["Rule", "RuleDelayed"].includes(e.head.val);
