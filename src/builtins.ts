import { Int, Symbol, Expr, List, Form } from './ast';
import { symbol } from './symbols';
import { attrs, setAttrs } from './attrs';

type Builtin = (parts: Expr[]) => Expr;
const builtinsTable: Map<Symbol, Builtin> = new Map();

export const builtin = (sym: Symbol): Builtin | undefined => builtinsTable.get(sym);

export const populateBuiltins = () => {
  builtinsTable.set(symbol('Attributes'), Attributes);
  setAttrs(symbol('Attributes'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('Plus'), Plus);
  setAttrs(symbol('Plus'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('Times'), Times);
  setAttrs(symbol('Times'), ["Protected"].map(symbol));
}

const Attributes = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw `Attributes called with ${parts.length} arguments; 1 argument is expected.`;
  }

  if (parts[0] instanceof Symbol) {
    return new List(attrs(parts[0]));
  } else if (parts[0] instanceof List) {
    return new List(parts.map(x => {
      if (x instanceof Symbol) {
        return new List(attrs(x));
      }
      throw 'Attributes expects symbol or a list of symbols.';
    }));
  }

  throw 'Attributes expects symbol or a list of symbols.';
}

const Plus = (parts: Expr[]) => {
  let acc: number = 0;
  let rest: Expr[] = [];
  for (const part of parts) {
    if (part instanceof Int) {
      acc += part.val;
    } else {
      rest.push(part);
    }
  }

  if (rest.length == 0) {
    return new Int(acc);
  } else {
    return new Form(symbol("Plus"), acc == 0 ? rest : [new Int(acc), ...rest]);
  }
}

const Times = (parts: Expr[]) => {
  let acc: number = 1;
  let rest: Expr[] = [];
  for (const part of parts) {
    if (part instanceof Int) {
      acc *= part.val;
    } else {
      rest.push(part);
    }
  }

  if (rest.length == 0) {
    return new Int(acc);
  } else {
    return new Form(symbol("Times"), acc == 1 ? rest : [new Int(acc), ...rest]);
  }
}
