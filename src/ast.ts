import { builtin } from './builtins';
import { replaceRepeated, rulesToPairs, Env } from './rewrite';
import { downValues, ownValues } from './values';
import type { Expr, Form, Integer, String, Symbol } from './expr';
import { form, isForm, isSymbol, Types } from './expr';

export type Dispatch<T> = {
  Integer: (i: Integer) => T,
  Symbol: (s: Symbol) => T
  String: (s: String) => T,
  Form: (f: Form) => T,
}

export const dispatch = <T>(e: Expr, d: Dispatch<T>): T => {
  if (e.type == Types.Integer) {
    return d.Integer(e);
  } else if (e.type == Types.Symbol) {
    return d.Symbol(e);
  } else if (e.type == Types.Form) {
    return d.Form(e);
  } else if (e.type == Types.String) {
    return d.String(e);
  }
  throw "Unknown type";
}

export const eval_ = (e: Expr, lenv: Env): Expr => {
  // We don't use `dispatch` to make `eval_` implementation
  // pretty like `repr`, because `dispatch` is about 7 times
  // slower than branching like this.
  if (e.type == Types.Integer) {
    return e;
  } else if (e.type == Types.Symbol) {
    return evalSym(e, lenv);
  } else if (e.type == Types.String) {
    return e;
  } else if (e.type == Types.Form) {
    return evalForm(e, lenv);
  }
  throw "Unknown type";
};

const evalSym = (sym: Symbol, localEnv: Env): Expr => {
  if (localEnv.has(sym)) {
    return localEnv.get(sym)!;
  }

  const ownvals = ownValues.get(sym);
  return ownvals ? replaceRepeated(sym, rulesToPairs(ownvals)) : sym;
}

const evalForm = (f: Form, lenv: Env): Expr => {
  const head_ = eval_(f.head, lenv);
  
  let parts_ = new Array<Expr>(f.parts.length);
  if (f.parts.length > 0) {
    parts_[0] = (isSymbol(head_) && head_.attrs.holdFirst) ?
      f.parts[0] : eval_(f.parts[0], lenv);

    for (let i = 1; i < f.parts.length; i++) {
      parts_[i] = (isSymbol(head_) && head_.attrs.holdRest) ?
        f.parts[i] : eval_(f.parts[i], lenv);
    }
  }

  if (!isSymbol(head_)) {
    return form(head_, parts_);
  }

  if (head_.attrs.flat && parts_.some(p => isForm(p) && p.head == head_)) {
    let parts2: Expr[] = [];
    for (const part of parts_) {
      if (isForm(part) && part.head === head_) {
        parts2 = [...parts2, ...part.parts];
      } else {
        parts2.push(part);
      }
    }
    parts_ = parts2;
  }

  let evaled: Expr = form(head_, parts_);

  // check DownValues
  const downvals = downValues.get(head_);
  evaled = downvals ? replaceRepeated(evaled, rulesToPairs(downvals)) : evaled;

  // Check builtins
  if (isForm(evaled) && isSymbol(evaled.head)) {
    const fn = builtin(evaled.head);
    if (fn) {
      evaled = fn(evaled.parts, evaled);
    }
  }

  return evaled;
};
