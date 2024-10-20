import { attrs } from './attrs';
import { builtin } from './builtins';
import { replaceRepeated, rulesToPairs, Env } from './rewrite';
import { downValues, ownValues } from './values';

export type Expr = Integer | Symbol | Form;

export enum Types {
  Form, Integer, Symbol,
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
}

const symtable: Map<string, Symbol> = new Map();

export const isForm = (e: Expr): e is Form => e.type == Types.Form;
export const isInteger = (e: Expr): e is Integer => e.type == Types.Integer;
export const isSymbol = (e: Expr): e is Symbol => e.type == Types.Symbol;

export const form = (head: Expr, parts: Expr[]): Form => ({
  type: Types.Form,
  head, parts,
});

export const int = (val: number): Integer => ({
  type: Types.Integer,
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
    };
    symtable.set(val, sym_);
    return sym_;
  }
};

export const list = (els: Expr[]) => form(sym("List"), els);
export const isList = (e: Expr): e is Form => isForm(e) && isSymbol(e.head) && e.head.val == "List";

export type Dispatch<T> = {
  Integer: (i: Integer) => T,
  Symbol: (s: Symbol) => T
  Form: (f: Form) => T,
}

export const match = <T>(e: Expr, d: Dispatch<T>): T => {
  if (e.type == Types.Integer) {
    return d.Integer(e);
  } else if (e.type == Types.Symbol) {
    return d.Symbol(e);
  } else if (e.type == Types.Form) {
    return d.Form(e);
  }
  throw "Unknown type";
}

export const repr = (e: Expr): string => match(e, {
  Integer: e => e.val.toString(),
  Symbol: e => e.val,
  Form: e => `${repr(e.head)}[${e.parts.map(x => repr(x)).join(", ")}]`,
});

export const eval_ = (e: Expr, lenv: Env): Expr => {
  // We don't use `match` to make `eval_` implementation
  // pretty like `repr`, because `match` is about 7 times
  // slower than branching like this.
  if (e.type == Types.Integer) {
    return e;
  } else if (e.type == Types.Symbol) {
    return evalSym(e, lenv);
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
    const first =
      (attrs(head_).includes(sym("HoldFirst"))
      || attrs(head_).includes(sym("HoldAll")))
        ? f.parts[0] : eval_(f.parts[0], lenv);

    const rest =
      (attrs(head_).includes(sym("HoldRest"))
      || attrs(head_).includes(sym("HoldAll")))
        ? f.parts.slice(1) : f.parts.slice(1).map(el => eval_(el, lenv));

    parts_ = [first, ...rest];
  } else {
    parts_ = f.parts.map(el => eval_(el, lenv));
  }

  if (!(isSymbol(head_))) {
    return form(head_, parts_);
  }

  if (attrs(head_).includes(sym("Flat"))) {
    let parts2: Expr[] = [];
    for (const part of parts_) {
      if (isForm(part) && isSymbol(part.head) && part.head.val === head_.val) {
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
