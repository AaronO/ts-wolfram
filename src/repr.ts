import { Expr, Form, dispatch, isForm, isSymbol } from './ast';

export const repr = (e: Expr): string => dispatch(e, {
  Integer: e => e.val.toString(),
  Symbol: e => e.val,
  String: e => e.val,
  Form: e => reprForm(e),
});

const reprForm = (f: Form) => {
  let res: string;
  if (isSymbol(f.head, "Rule")) {
    res = `${repr(f.parts[0])}->${repr(f.parts[1])}`;
  } else if (isSymbol(f.head, "RuleDelayed")) {
    res = `${repr(f.parts[0])}:>${repr(f.parts[1])}`;
  } else if (isSymbol(f.head, "Plus")) {
    res = f.parts.map(reprMaybeParenExpr).join(" + ");
  } else if (isSymbol(f.head, "Times")) {
    res = f.parts.map(reprMaybeParenExpr).join(" ");
  } else if (isSymbol(f.head, "List")) {
    res = `{${f.parts.map(repr).join(", ")}}`;
  } else if (isSymbol(f.head, "FullForm")) {
    res = dumbRepr(f.parts[0]);
  } else {
    res = `${repr(f.head)}[${f.parts.map(x => repr(x)).join(", ")}]`;
  }

  return res;
}

const reprMaybeParenExpr = (e: Expr) =>
  isForm(e) ? `(${repr(e)})` : repr(e);

export const dumbRepr = (e: Expr): string => dispatch(e, {
  Integer: e => e.val.toString(),
  Symbol: e => e.val,
  String: e => e.val,
  Form: e => `${dumbRepr(e.head)}[${e.parts.map(x => dumbRepr(x)).join(", ")}]`,
});
