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
export const isForm = (e: Expr): e is Form => e.type == Types.Form;
export const isFormHead = <T extends Symbol>(e: Expr, x: T): e is Form & { head: T } =>
  (e as Form).head === x;
export const isList = (e: Expr): e is Form => isForm(e) && isSymbol(e.head, "List");

export const int = (val: number): Integer => ({
  type: Types.Integer,
  val,
});

export const str = (val: string): String => ({
  type: Types.String,
  val,
});

const symtable = new Map();

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
}

export const form = (head: Expr, parts: Expr[]): Form => ({
  type: Types.Form,
  head, parts,
});

export const list = (els: Expr[]) => form(sym("List"), els);
