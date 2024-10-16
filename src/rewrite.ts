import { Form, Expr, Symbol, Int } from "./ast"

export type Env = Map<Symbol, Expr>;

export const match = (e: Expr, p: Expr): [boolean, Env] => {
  const env: Env = new Map();

  // Treat `HoldPattern` specially
  if (p instanceof Form && p.head instanceof Symbol && p.head.val == 'HoldPattern') {
    p = p.parts[0];
    // TODO: add HoldPattern to builtins, check arg count, set attrs
  }

  // match patterns first
  if (isBlank(p)) {
    return [true, env];
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
      const [matchesp, env_] = match(e.parts[i], p.parts[i]);
      if (!matchesp) { return [false, env]; }
      // TODO: merge envs
    }
    return [true, env];
  }

  return [false, env];
}

const isBlank = (e: Expr) =>
  e instanceof Form && e.head instanceof Symbol && e.head.val == 'Blank';
