import { Int, Symbol, Expr, Form } from './ast';
import { symbol } from './symbols';
import { attrs, setAttrs, clearAttrs } from './attrs';
import { match, replace, replaceAll, replaceRepeated, isRule } from './rewrite';
import { list, isList } from './list';
import { assign, ownValues, downValues } from './values';

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

  // number operations
  builtinsTable.set(symbol('Plus'), Plus);
  setAttrs(symbol('Plus'), ["Protected", "Flat"].map(symbol));

  builtinsTable.set(symbol('Times'), Times);
  setAttrs(symbol('Times'), ["Protected", "Flat"].map(symbol));

  builtinsTable.set(symbol('Power'), Power);
  setAttrs(symbol('Power'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('Minus'), Minus);
  setAttrs(symbol('Minus'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('NumberQ'), NumberQ);
  setAttrs(symbol('NumberQ'), ["Protected"].map(symbol));

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

  builtinsTable.set(symbol('PatternTest'), PatternTest);
  setAttrs(symbol('PatternTest'), ["HoldRest", "Protected"].map(symbol));

  builtinsTable.set(symbol('Blank'), Blank);
  setAttrs(symbol('Blank'), ["Protected"].map(symbol));

  // Term rewriting
  builtinsTable.set(symbol('Replace'), Replace);
  setAttrs(symbol('Replace'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('ReplaceAll'), ReplaceAll);
  setAttrs(symbol('ReplaceAll'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('ReplaceRepeated'), ReplaceRepeated);
  setAttrs(symbol('ReplaceRepeated'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('Rule'), Rule);
  setAttrs(symbol('Rule'), ["Protected"].map(symbol));

  builtinsTable.set(symbol('RuleDelayed'), RuleDelayed);
  setAttrs(symbol('RuleDelayed'), ["HoldRest", "Protected"].map(symbol));

  // Values (Own, Down)
  builtinsTable.set(symbol('Set'), Set_);
  setAttrs(symbol('Set'), ["HoldFirst", "Protected"].map(symbol));

  builtinsTable.set(symbol('SetDelayed'), SetDelayed);
  setAttrs(symbol('SetDelayed'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('OwnValues'), OwnValues);
  setAttrs(symbol('OwnValues'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('DownValues'), DownValues);
  setAttrs(symbol('DownValues'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('Clear'), Clear);
  setAttrs(symbol('Clear'), ["HoldAll", "Protected"].map(symbol));

  // evaluation control
  builtinsTable.set(symbol('Hold'), Hold);
  setAttrs(symbol('Hold'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('CompoundExpression'), CompoundExpression);
  setAttrs(symbol('CompoundExpression'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('Do'), Do);
  setAttrs(symbol('Do'), ["HoldAll", "Protected"].map(symbol));

  builtinsTable.set(symbol('Timing'), Timing);
  setAttrs(symbol('Timing'), ["HoldAll", "Protected"].map(symbol));
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
  Number operations
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
  } else if (acc == 0 && rest.length == 1) {
    return rest[0];
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

  if (acc == 0) {
    return new Int(0);
  }

  if (rest.length == 0) {
    return new Int(acc);
  } else if (acc == 1 && rest.length == 1) {
    return rest[0];
  } else {
    return new Form(symbol("Times"), acc == 1 ? rest : [new Int(acc), ...rest]);
  }
}

const Minus = (parts: Expr[], self: Expr) => {
  if (parts.length != 1) {
    throw errArgCount('Minus', 1, parts.length);
  }

  if (parts[0] instanceof Int) {
    return new Int(-parts[0].val);
  } else {
    return self;
  }
}

const Power = (parts: Expr[], self: Expr) => {
  if (parts.length != 2) {
    throw errArgCount('Power', 2, parts.length);
  }

  if (parts[0] instanceof Int
    && parts[0].val == 0
    && parts[1] instanceof Int
    && parts[1].val == 0)
  {
    throw "Indeterminate expression";
  }

  if (parts[0] instanceof Int && parts[0].val == 1) {
    return new Int(1);
  }

  if (parts[1] instanceof Int) {
    if (parts[1].val == 0) {
      return new Int(1);
    } else if (parts[1].val == 1) {
      return parts[0];
    }
  }

  return self;
}

const NumberQ = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Hold', 1, parts.length);
  }

  return symbol(parts[0] instanceof Int ? 'True' : 'False');
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

const PatternTest = (parts: Expr[], self: Expr) => {
  if (parts.length != 2) {
    throw errArgCount('PatternTest', 2, parts.length);
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
    if (!isRule(rule)) { throw "ReplaceAll expects a rule or a list of rules."; }
    return [rule.parts[0], rule.parts[1]];
  }));
}

const ReplaceRepeated = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('ReplaceRepeated', 2, parts.length);
  }

  const expr = parts[0];
  const rules = isList(parts[1]) ? parts[1].parts : [parts[1]];
  return replaceRepeated(expr, rules.map(rule => {
    if (!isRule(rule)) { throw "ReplaceRepeated expects a rule or a list of rules."; }
    return [rule.parts[0], rule.parts[1]];
  }));
}

const Rule = (parts: Expr[], self: Expr) => {
  if (parts.length != 2) {
    throw errArgCount('Rule', 2, parts.length);
  }
  return self;
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
  if (parts.length != 2) {
    throw errArgCount('SetDelayed', 2, parts.length);
  }

  assign(parts[0], parts[1]);
  return symbol('Null');
}

const SetDelayed = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('SetDelayed', 2, parts.length);
  }

  assign(parts[0], parts[1]);
  return symbol('Null');
}

const OwnValues = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('OwnValues', 1, parts.length);
  }

  if (!(parts[0] instanceof Symbol)) {
    throw errArgType('OwnValues', ['a symbol']);
  }

  return list(ownValues.get(parts[0]) || []);
}

const DownValues = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('DownValues', 1, parts.length);
  }

  if (!(parts[0] instanceof Symbol)) {
    throw errArgType('DownValues', ['a symbol']);
  }

  return list(downValues.get(parts[0]) || []);
}

const Clear = (parts: Expr[]) => {
  let doerr = false;
  for (const s of parts) {
    if (!(s instanceof Symbol)) {
      doerr = true;
      continue;
    }
    ownValues.delete(s);
    downValues.delete(s);
  }

  if (doerr) {
    throw "Symbols only please."
  }
  return symbol("Null");
}

/*
  Evaluation control
*/
const Hold = (parts: Expr[], self: Expr) => {
  if (parts.length != 1) {
    throw errArgCount('Hold', 1, parts.length);
  }

  return self;
}

const CompoundExpression = (parts: Expr[]) => {
  let res: Expr = symbol("Null");
  for (const part of parts) {
    res = part.eval(new Map());
  }
  return res;
}

const Do = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('Do', 2, parts.length);
  }

  if (!(parts[1] instanceof Int)) {
    throw errArgType("Do", ["an integer"]);
  }

  let res: Expr = symbol("Null");
  for (let i = 0; i < parts[1].val; i++) {
    res = parts[0].eval(new Map());
  }

  return res;
}

const Timing = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Timing', 1, parts.length);
  }

  const env = new Map();

  const startTime = process.cpuUsage();
  const res = parts[0].eval(env);
  const diffTime = process.cpuUsage(startTime);

  const cpuInUs = diffTime.user + diffTime.system;
  return new Form(symbol("List"), [new Int(cpuInUs / 1_000_000), res]);
}

/*
  Error msg utils
*/
const errArgCount = (fnname: string, expected: number | string, actual: number) =>
  `${fnname} called with ${actual} arguments; ${expected} argument is expected.`;

const errArgType = (fnname: string, types: string[]) =>
  `${fnname} expects ${types.join(" or ")}.`;
