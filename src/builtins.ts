import { Int, Symbol, Expr, Form } from './ast';
import { symbol } from './symbols';
import { attrs, setAttrs, clearAttrs } from './attrs';
import { match } from './rewrite';
import { list, isList } from './list';

type Builtin = (parts: Expr[]) => Expr;
const builtinsTable: Map<Symbol, Builtin> = new Map();

export const builtin = (sym: Symbol): Builtin | undefined => builtinsTable.get(sym);

export const populateBuiltins = () => {
  setAttrs(symbol('Null'), ["Protected"].map(symbol));

  // attributes
  builtinsTable.set(symbol('Attributes'), Attributes);
  setAttrs(symbol('Attributes'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('SetAttributes'), SetAttributes);
  setAttrs(symbol('SetAttributes'), ["HoldFirst", "Protected"].map(symbol));

  builtinsTable.set(symbol('ClearAttributes'), ClearAttributes);
  setAttrs(symbol('ClearAttributes'), ["HoldFirst", "Protected"].map(symbol));

  // field operations
  builtinsTable.set(symbol('Plus'), Plus);
  setAttrs(symbol('Plus'), ["Protected", "Flat"].map(symbol));

  builtinsTable.set(symbol('Times'), Times);
  setAttrs(symbol('Times'), ["Protected", "Flat"].map(symbol));

  // form manipulation
  builtinsTable.set(symbol('Head'), Head);
  setAttrs(symbol('Head'), ["Protected"].map(symbol));

  // Term rewriting
  builtinsTable.set(symbol('MatchQ'), MatchQ);
  setAttrs(symbol('MatchQ'), ["Protected"].map(symbol));
}

/*
  Attributes
*/
const Attributes = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Attributes', 1, parts.length);
  }

  if (parts[0] instanceof Symbol) {
    return list(attrs(parts[0]));
  } else if (isList(parts[0])) {
    return list(parts[0].parts.map(x => {
      if (x instanceof Symbol) {
        return list(attrs(x));
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
  let syms = (isList(parts[0]) ? parts[0].parts : [parts[0]]).map(s => {
    if (!(s instanceof Symbol)) {
      throw errArgType('SetAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  })

  const attrs = (isList(parts[1]) ? parts[1].parts : [parts[1]]).map(s => {
    if (!(s instanceof Symbol)) {
      throw errArgType('SetAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  });

  for (const sym of syms) {
    setAttrs(sym, attrs);
  }

  return symbol('Null');
}

const ClearAttributes = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('ClearAttributes', 2, parts.length);
  }
  let syms = (isList(parts[0]) ? parts[0].parts : [parts[0]]).map(s => {
    if (!(s instanceof Symbol)) {
      throw errArgType('ClearAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  })

  const attrs = (isList(parts[1]) ? parts[1].parts : [parts[1]]).map(s => {
    if (!(s instanceof Symbol)) {
      throw errArgType('ClearAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  });

  for (const sym of syms) {
    clearAttrs(sym, attrs);
  }

  return symbol('Null');
}

/*
  Field operations
*/
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

/*
  Form manipulation
*/
export const Head = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Head', 1, parts.length);
  }

  const e = parts[0];
  if (e instanceof Int) {
    return symbol("Integer");
  } else if (e instanceof Symbol) {
    return symbol("Symbol");
  } else if (e instanceof Form) {
    return e.head;
  }

  throw "ThisShouldNeverHappenException:)"
}

/*
  Term rewriting
*/
const MatchQ = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('MatchQ', 2, parts.length);
  }

  const [matches] = match(parts[0], parts[1]);
  return symbol(matches ? "True" : "False");
}

/*
  Error msg utils
*/
const errArgCount = (fnname: string, expected: number, actual: number) =>
  `${fnname} called with ${actual} arguments; ${expected} argument is expected.`;

const errArgType = (fnname: string, types: string[]) =>
  `${fnname} expects ${types.join(" or ")}.`;
