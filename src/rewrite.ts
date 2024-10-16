import { Form, Expr, Symbol, Int, Null } from "./ast"
import { isList } from "./list";

export type Env = Map<Symbol, Expr>;

export const match = (e: Expr, p: Expr): [boolean, Env] => {
  const env: Env = new Map();

  if (p instanceof Form && p.head instanceof Symbol && p.head.val == 'HoldPattern') {
    p = p.parts[0];
    // TODO: add HoldPattern to builtins, check arg count, set attrs
  }

  if (e instanceof Int && p instanceof Int) {
    return [p.val == e.val, env];
  } else if (e instanceof Symbol && p instanceof Symbol) {
    return [p == e, env];
  } else if (e instanceof Null && p instanceof Null) {
    return [true, env];
  } else if (isList(e) && isList(p)) {
    if (e.parts.length != p.parts.length) { return [false, env]; }
    for(let i = 0; i<e.parts.length; i++) {
      const [matchesp, env_] = match(e.parts[i], p.parts[i]);
      if (!matchesp) { return [false, env]; }
      // TODO: merge envs
    }
    return [true, env];
  } else if (e instanceof Form && p instanceof Form) {
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
