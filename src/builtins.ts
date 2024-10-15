import { Int, Symbol, Expr, List, Form, Null } from './ast';
import { symbol } from './symbols';
import { attrs, setAttrs } from './attrs';

type Builtin = (parts: Expr[]) => Expr;
const builtinsTable: Map<Symbol, Builtin> = new Map();

export const builtin = (sym: Symbol): Builtin | undefined => builtinsTable.get(sym);

export const populateBuiltins = () => {
  builtinsTable.set(symbol('Attributes'), Attributes);
  setAttrs(symbol('Attributes'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('SetAttributes'), SetAttributes);
  setAttrs(symbol('SetAttributes'), ["HoldFirst", "Protected"].map(symbol));

  builtinsTable.set(symbol('Plus'), Plus);
  setAttrs(symbol('Plus'), ["Protected", "Flat"].map(symbol));

  builtinsTable.set(symbol('Times'), Times);
  setAttrs(symbol('Times'), ["Protected", "Flat"].map(symbol));
}

const Attributes = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Attributes', 1, parts.length);
  }

  if (parts[0] instanceof Symbol) {
    return new List(attrs(parts[0]));
  } else if (parts[0] instanceof List) {
    return new List(parts[0].vals.map(x => {
      if (x instanceof Symbol) {
        return new List(attrs(x));
      }
      throw errArgType('Attributes', ['a symbol', 'a list of symbols']);
    }));
  }

  throw errArgType('Attributes', ['a symbol', 'a list of symbols']);
}

const SetAttributes = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('SetAttributes', 2, parts.length);
  }
  let syms = (parts[0] instanceof List ? parts[0].vals : [parts[0]]).map(s => {
    if (!(s instanceof Symbol)) {
      throw errArgType('SetAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  })

  const attrs = (parts[1] instanceof List ? parts[1].vals : [parts[1]]).map(s => {
    if (!(s instanceof Symbol)) {
      throw errArgType('SetAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  });

  for (const sym of syms) {
    setAttrs(sym, attrs);
  }

  return new Null();
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

const errArgCount = (fnname: string, expected: number, actual: number) =>
  `${fnname} called with ${actual} arguments; ${expected} argument is expected.`;

const errArgType = (fnname: string, types: string[]) =>
  `${fnname} expects ${types.join(" or ")}.`;
