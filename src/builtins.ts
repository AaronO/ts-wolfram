import { Int, Symbol, Expr, Form } from './ast';
import { symbol } from './symbols';
import { attrs, setAttrs, clearAttrs } from './attrs';
import { match, replace, replaceAll } from './rewrite';
import { list, isList } from './list';

type Builtin = (parts: Expr[], self: Expr) => Expr;
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

  // Pattern matching
  builtinsTable.set(symbol('MatchQ'), MatchQ);
  setAttrs(symbol('MatchQ'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('HoldPattern'), HoldPattern);
  setAttrs(symbol('HoldPattern'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('Pattern'), Pattern);
  setAttrs(symbol('Pattern'), ["HoldFirst", "Protected"].map(symbol));

  builtinsTable.set(symbol('Blank'), Blank);
  setAttrs(symbol('Blank'), ["Protected"].map(symbol));

  // Term rewriting
  builtinsTable.set(symbol('Replace'), Replace);
  setAttrs(symbol('Replace'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('ReplaceAll'), ReplaceAll);
  setAttrs(symbol('ReplaceAll'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('RuleDelayed'), RuleDelayed);
  setAttrs(symbol('RuleDelayed'), ["HoldRest", "Protected"].map(symbol));

  // Values (Own, Down)
  builtinsTable.set(symbol('Set'), Set_);
  setAttrs(symbol('Set'), ["HoldFirst", "Protected"].map(symbol));

  builtinsTable.set(symbol('SetDelayed'), SetDelayed);
  setAttrs(symbol('SetDelayed'), ["HoldAll", "Protected"].map(symbol));
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
  Pattern matching
*/
const MatchQ = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('MatchQ', 2, parts.length);
  }

  const [matches, env] = match(parts[0], parts[1]);
  if (!matches) {
    return symbol("False");
  }

  // Uncomment to debug environment
  for (const k of Array.from(env.keys())) {
    //console.log(`${k.repr()} -> ${env.get(k)!.repr()}`);
  }

  return symbol("True");
}

const HoldPattern = (parts: Expr[], self: Expr) => {
  if (parts.length != 1) {
    throw errArgCount('HoldPattern', 1, parts.length);
  }

  return self;
}

const Pattern = (parts: Expr[], self: Expr) => {
  if (parts.length != 2) {
    throw errArgCount('Pattern', 2, parts.length);
  }

  return self;
}

const Blank = (parts: Expr[], self: Expr) => {
  if (parts.length > 1) {
    throw errArgCount('Blank', "0 - 1", parts.length);
  }
  if (parts.length == 1 && !(parts[0] instanceof Symbol)) {
    throw errArgType('Blank', ['a symbol']);
  }

  return self;
}

/*
  Term rewriting
*/
const isRule = (e: Expr): e is Form =>
  e instanceof Form
  && e.head instanceof Symbol
  && ["Rule", "RuleDelayed"].includes(e.head.val);

const Replace = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('Replace', 2, parts.length);
  }

  const expr = parts[0];
  const rules = isList(parts[1]) ? parts[1].parts : [parts[1]];
  const [replacedp, res] = replace(expr, rules.map(rule => {
    if (!isRule(rule)) { throw "Replace expects a rule or a list of rules."; }
    return [rule.parts[0], rule.parts[1]];
  }));

  if (replacedp) {
    return res;
  }

  return expr;
}

const ReplaceAll = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('ReplaceAll', 2, parts.length);
  }

  const expr = parts[0];
  const rules = isList(parts[1]) ? parts[1].parts : [parts[1]];
  return replaceAll(expr, rules.map(rule => {
    if (!isRule(rule)) { throw "Replace expects a rule or a list of rules."; }
    return [rule.parts[0], rule.parts[1]];
  }));
}

const RuleDelayed = (parts: Expr[], self: Expr) => {
  if (parts.length != 2) {
    throw errArgCount('RuleDelayed', 2, parts.length);
  }
  return self;
}

/*
  Values
*/
const Set_ = (parts: Expr[]) => {
  throw "TODO;"
}

const SetDelayed = (parts: Expr[]) => {
  throw "TODO;"
}

/*
  Error msg utils
*/
const errArgCount = (fnname: string, expected: number | string, actual: number) =>
  `${fnname} called with ${actual} arguments; ${expected} argument is expected.`;

const errArgType = (fnname: string, types: string[]) =>
  `${fnname} expects ${types.join(" or ")}.`;
