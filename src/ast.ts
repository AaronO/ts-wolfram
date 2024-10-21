import { builtin } from './builtins';
import { replaceRepeated, rulesToPairs, Env } from './rewrite';
import { downValues, ownValues } from './values';
import type { AttrVec } from './attrs';

export type Expr = Integer | Symbol | Form | String;

export enum Types {
  Form, Integer, Symbol, String,
}

export type Form = {
  type: Types.Form,
  head: Expr,
  parts: Expr[],
}

export type Integer = {
  type: Types.Integer,
  val: number,
}

export type Symbol = {
  type: Types.Symbol,
  val: string,
  attrs: AttrVec,
}

export type String = {
  type: Types.String,
  val: string,
}

const symtable: Map<string, Symbol> = new Map();

export const isForm = (e: Expr): e is Form => e.type == Types.Form;
export const isInteger = (e: Expr): e is Integer => e.type == Types.Integer;
export const isString = (e: Expr): e is String => e.type == Types.String;
export const isSymbol = (e: Expr, s?: string): e is Symbol => {
  if (e.type != Types.Symbol) {
    return false;
  }
  if (s && e.val != s) {
    return false;
  }
  return true;
}

export const form = (head: Expr, parts: Expr[]): Form => ({
  type: Types.Form,
  head, parts,
});

export const int = (val: number): Integer => ({
  type: Types.Integer,
  val,
});

export const str = (val: string): String => ({
  type: Types.String,
  val,
});

export const sym = (val: string): Symbol => {
  let sym_ = symtable.get(val);
  if (sym_) {
    return sym_;
  } else {
    sym_ = {
      type: Types.Symbol,
      val,
      attrs: {},
    };
    symtable.set(val, sym_);
    return sym_;
  }
};

export const list = (els: Expr[]) => form(sym("List"), els);
export const isList = (e: Expr): e is Form => isForm(e) && isSymbol(e.head, "List");

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

export const repr = (e: Expr): string => dispatch(e, {
  Integer: e => e.val.toString(),
  Symbol: e => e.val,
  String: e => e.val,
  Form: e => `${repr(e.head)}[${e.parts.map(x => repr(x)).join(", ")}]`,
});

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
  
  let parts_: Expr[];
  if (isSymbol(head_) && f.parts.length > 0) {
    const first = head_.attrs.holdFirst
      ? f.parts[0] : eval_(f.parts[0], lenv);

    const rest = head_.attrs.holdRest
      ? f.parts.slice(1) : f.parts.slice(1).map(el => eval_(el, lenv));

    parts_ = [first, ...rest];
  } else {
    parts_ = f.parts.map(el => eval_(el, lenv));
  }

  if (!(isSymbol(head_))) {
    return form(head_, parts_);
  }

  if (head_.attrs.flat) {
    let parts2: Expr[] = [];
    for (const part of parts_) {
      if (isForm(part) && part.head === head_) {
        parts2 = [...parts2, ...part.parts];
      } else {
        parts2 = [...parts2, part];
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
