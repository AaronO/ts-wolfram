import { eval_, } from "./ast"
import { Form, Expr, Symbol, isForm, isSymbol, form, sym, isFormHead, Types, Integer, String } from "./expr"
import { Head } from "./builtins";

export type Env = Map<Symbol, Expr>;

const EMPTY_ENV: Env = new Map();
const HOLD_PATTERN = sym("HoldPattern");
const SYM_PATTERN = sym("Pattern");
const SYM_PATTERN_TEST = sym("PatternTest");
const SYM_BLANK = sym("Blank");
const SYM_RULE = sym("Rule");
const SYM_RULE_DELAYED = sym("RuleDelayed");

export const match = (e: Expr, p: Expr): { matchp: boolean, env: Env } => {
  if (e === p) {
    return { matchp: true, env: EMPTY_ENV };
  }
  // Treat `HoldPattern` specially
  if (isFormHead(p, HOLD_PATTERN)) {
    p = p.parts[0];
  }

  // Match special forms
  if (isFormHead(p, SYM_BLANK)) {
    return { matchp: matchBlank(e, p), env: EMPTY_ENV };
  }
  if (isFormHead(p, SYM_PATTERN)) {
    return matchPattern(e, p);
  }
  if (isFormHead(p, SYM_PATTERN_TEST)) {
    return matchPatternTest(e, p);
  }

  if (e.type !== p.type) {
    return { matchp: false, env: EMPTY_ENV };
  } else if (e.type === Types.Symbol) {
    return { matchp: p == e, env: EMPTY_ENV };
  } else if (e.type === Types.Integer) {
    return { matchp: (p as Integer).val == (e as Integer).val, env: EMPTY_ENV };
  } else if (e.type === Types.String) {
    return { matchp: (p as String).val == (e as String).val, env: EMPTY_ENV };
  } else if (e.type === Types.Form) {
    return matchForm(e as Expr as Form, p as Expr as Form);
  } else {
    return { matchp: false, env: EMPTY_ENV };
  }
}

const matchForm = (e: Form, p: Form): { matchp: boolean, env: Env } => {
  if (e.parts.length != p.parts.length) { return { matchp: false, env: EMPTY_ENV }; }

  let env: Env | null = EMPTY_ENV;

  const { matchp, env: env_ } = match(e.head, p.head);
  if (!matchp) { return { matchp: false, env: EMPTY_ENV }; }
  env = mergeEnv(env, env_);
  if (env === null) { return { matchp: false, env: EMPTY_ENV }; }

  for(let i = 0; i<e.parts.length; i++) {
    const { matchp, env: env_ } = match(e.parts[i], p.parts[i]);
    if (!matchp) { return { matchp: false, env: EMPTY_ENV }; }
    env = mergeEnv(env, env_);
    if (env === null) { return { matchp: false, env: EMPTY_ENV }; }
  }
  return { matchp: true, env };
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

const matchPattern = (e: Expr, p: Form): { matchp: boolean, env: Env } => {
  if (!isSymbol(p.parts[0])
    || !isForm(p.parts[1])
    || !isFormHead(p.parts[1], SYM_BLANK))
  {
    throw "ThisShouldNeverHappenException:)";
  }
  if (!matchBlank(e, p.parts[1])) {
    return { matchp: false, env: EMPTY_ENV };
  }

  const env = new Map();
  env.set(p.parts[0], e);
  return { matchp: true, env };
}

const matchPatternTest = (e: Expr, p: Form): { matchp: boolean, env: Env } => {
  const { matchp, env } = match(e, p.parts[0]);
  if (!matchp) {
    return { matchp: false, env: EMPTY_ENV };
  }

  const testForm = form(p.parts[1], [e]);
  const passedp = eval_(testForm, env) == sym('True');

  return { matchp: passedp, env };
}

const mergeEnv = (acc: Env, mergee: Env): Env | null => {
  if (acc === EMPTY_ENV && mergee === EMPTY_ENV) {
    return EMPTY_ENV;
  }
  
  if (acc === EMPTY_ENV) {
    // return new Map(mergee);
    return mergee;
  }
  
  if (mergee === EMPTY_ENV) {
    return acc;
  }

  const newEnv = new Map(acc);
  for (const k of mergee.keys()) {
    const v = mergee.get(k)!;
    if (newEnv.has(k)) {
      const { matchp } = match(newEnv.get(k)!, v);
      if (!matchp) {
        return null;
      }
    } else {
      newEnv.set(k, v);
    }
  }

  return newEnv;
}

export const replace = (expr: Expr, rules: [Expr, Expr][]): Expr | null => {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const m = match(expr, rule[0]);
    if (m.matchp) {
      return eval_(rule[1], m.env);
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
    const { matchp } = match(expr, expr_);
    if (matchp) {
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
