import { Form, Expr, Symbol, Int } from "./ast"
import { Head } from "./builtins";

export type Env = Map<Symbol, Expr>;

export const match = (e: Expr, p: Expr): [boolean, Env] => {
  let env: Env = new Map();

  // Treat `HoldPattern` specially
  if (p instanceof Form && p.head instanceof Symbol && p.head.val == 'HoldPattern') {
    p = p.parts[0];
    // TODO: add HoldPattern, Blank, Pattern to builtins, check arg count, set attrs
  }

  // match patterns first
  if (isBlank(p)) {
    return [matchBlank(e, p), env];
  }
  if (isPattern(p)) {
    return matchPattern(e,p);
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
    
    const [matches, _env] = match(e.head, p.head);
    if (!matches) { return [false, env]; }
    
    for(let i = 0; i<e.parts.length; i++) {
      let [matchesp, env_] = match(e.parts[i], p.parts[i]);
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