import { Form, Expr, Symbol, Int } from "./ast"
import { Head } from "./builtins";
import { symbol } from "./symbols";

export type Env = Map<Symbol, Expr>;

export const match = (e: Expr, p: Expr): [boolean, Env] => {
  let env: Env = new Map();

  // Treat `HoldPattern` specially
  if (p instanceof Form && p.head instanceof Symbol && p.head.val == 'HoldPattern') {
    p = p.parts[0];
  }

  // match patterns first
  if (isBlank(p)) {
    return [matchBlank(e, p), env];
  }
  if (isPattern(p)) {
    return matchPattern(e,p);
  }

  if (isPatternTest(p)) {
    return matchPatternTest(e,p);
  }

  // The rest is essentially deepEqual
  if (e instanceof Int && p instanceof Int) {
    return [p.val == e.val, env];
  }
  
  if (e instanceof Symbol && p instanceof Symbol) {
    return [p == e, env];
  }
  
  if (e instanceof Form && p instanceof Form) {
    if (e.parts.length != p.parts.length) { return [false, env]; }
    
    const eparts = [e.head, ...e.parts];
    const pparts = [p.head, ...p.parts];

    for(let i = 0; i<eparts.length; i++) {
      let [matchesp, env_] = match(eparts[i], pparts[i]);
      if (!matchesp) { return [false, env]; }

      [matchesp, env] = mergeEnv(env, env_);
      if (!matchesp) { return [false, env]; }
    }
    return [true, env];
  }

  return [false, env];
}

const isBlank = (e: Expr): e is Form =>
  e instanceof Form && e.head instanceof Symbol && e.head.val == 'Blank';

const matchBlank = (e: Expr, p: Form): boolean => {
  if (!(p.head instanceof Symbol && p.head.val == 'Blank')) {
    return false;
  }

  if (p.parts.length == 0) {
    return true;
  }

  return Head([e]) == p.parts[0];
}

const isPattern = (e: Expr): e is Form =>
  e instanceof Form && e.head instanceof Symbol && e.head.val == 'Pattern';

const matchPattern = (e: Expr, p: Form): [boolean, Env] => {
  const env: Env = new Map();
  if (!isBlank(p.parts[1])
    || !(p.parts[0] instanceof Symbol))
  {
    throw "ThisShouldNeverHappenException:)";
  }
  if (!matchBlank(e, p.parts[1])) {
    return [false, env];
  }

  env.set(p.parts[0], e);
  return [true, env];
}

const isPatternTest = (e: Expr): e is Form =>
  e instanceof Form && e.head instanceof Symbol && e.head.val == 'PatternTest';

const matchPatternTest = (e: Expr, p: Form): [boolean, Env] => {
  const [matchedp, env] = match(e, p.parts[0]);
  if (!matchedp) {
    return [false, env];
  }

  const testForm = new Form(p.parts[1], [e]);
  const passedp = testForm.eval(env) == symbol('True');

  return [passedp, env];
}

const mergeEnv = (env1: Env, env2: Env): [boolean, Env] => {
  const env: Env = new Map(env1);
  for (const k of Array.from(env2.keys())) {
    const v = env2.get(k)!;
    if (env.has(k)) {
      const [matches] = match(env.get(k)!, v);
      if (!matches) {
        return [false, env];
      }
    } else {
      env.set(k,v);
    }
  }

  return [true, env];
}

export const replace = (expr: Expr, rules: [Expr, Expr][]): [boolean, Expr] => {
  for (const [lhs, rhs] of rules) {
    const [matchesp, env] = match(expr, lhs);
    if (matchesp) {
      return [true, rhs.eval(env)];
    }
  }

  return [false, expr];
}

export const replaceAll = (expr: Expr,  rules: [Expr, Expr][]): Expr => {
  // try the whole expression first
  const [replacedp, res] = replace(expr, rules);
  if (replacedp || !(expr instanceof Form)) {
    return res;
  }

  return new Form(
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
  if (isRule(rule)) {
    return [rule.parts[0], rule.parts[1]];
  }
  throw "Expected a rule";
}

export const rulesToPairs = (rules: Expr[]) => rules.map(ruleToPair);

export const isRule = (e: Expr): e is Form =>
  e instanceof Form
  && e.head instanceof Symbol
  && ["Rule", "RuleDelayed"].includes(e.head.val);

