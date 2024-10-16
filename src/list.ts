import { Form, Expr, Symbol } from "./ast";
import { symbol } from "./symbols";

export const list = (els: Expr[]) =>
  new Form(symbol("List"), els);

export const isList = (o: Expr): o is Form =>
  o instanceof Form && o.head instanceof Symbol && o.head.val == 'List';