import { Symbol, Expr, isSymbol, isInteger, sym, list, isList, int, form, isForm, eval_, isString, dispatch, Form, str, repr } from './ast';
import { attrs, setAttrs, clearAttrs } from './attrs';
import { match, replace, replaceAll, replaceRepeated, isRule } from './rewrite';
import { assign, ownValues, downValues, withUnprotected } from './values';

type Builtin = (parts: Expr[], self: Expr) => Expr;
const builtinsTable: Map<Symbol, Builtin> = new Map();

export const builtin = (sym: Symbol): Builtin | undefined => builtinsTable.get(sym);

export const populateBuiltins = () =>
  withUnprotected(populateBuiltins_);

const populateBuiltins_ = () => {
  setAttrs(sym('Null'), ["Protected"].map(sym));

  // attributes
  builtinsTable.set(sym('Attributes'), Attributes);
  setAttrs(sym('Attributes'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('SetAttributes'), SetAttributes);
  setAttrs(sym('SetAttributes'), ["HoldFirst", "Protected"].map(sym));

  builtinsTable.set(sym('ClearAttributes'), ClearAttributes);
  setAttrs(sym('ClearAttributes'), ["HoldFirst", "Protected"].map(sym));

  // number operations
  builtinsTable.set(sym('Plus'), Plus);
  setAttrs(sym('Plus'), ["Protected", "Flat"].map(sym));

  builtinsTable.set(sym('Times'), Times);
  setAttrs(sym('Times'), ["Protected", "Flat"].map(sym));

  builtinsTable.set(sym('Power'), Power);
  setAttrs(sym('Power'), ["Protected"].map(sym));

  builtinsTable.set(sym('Minus'), Minus);
  setAttrs(sym('Minus'), ["Protected"].map(sym));

  builtinsTable.set(sym('NumberQ'), NumberQ);
  setAttrs(sym('NumberQ'), ["Protected"].map(sym));

  // form manipulation
  builtinsTable.set(sym('Head'), Head);
  setAttrs(sym('Head'), ["Protected"].map(sym));

  // Pattern matching
  builtinsTable.set(sym('MatchQ'), MatchQ);
  setAttrs(sym('MatchQ'), ["Protected"].map(sym));

  builtinsTable.set(sym('HoldPattern'), HoldPattern);
  setAttrs(sym('HoldPattern'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('Pattern'), Pattern);
  setAttrs(sym('Pattern'), ["HoldFirst", "Protected"].map(sym));

  builtinsTable.set(sym('PatternTest'), PatternTest);
  setAttrs(sym('PatternTest'), ["HoldRest", "Protected"].map(sym));

  builtinsTable.set(sym('Blank'), Blank);
  setAttrs(sym('Blank'), ["Protected"].map(sym));

  // Term rewriting
  builtinsTable.set(sym('Replace'), Replace);
  setAttrs(sym('Replace'), ["Protected"].map(sym));

  builtinsTable.set(sym('ReplaceAll'), ReplaceAll);
  setAttrs(sym('ReplaceAll'), ["Protected"].map(sym));

  builtinsTable.set(sym('ReplaceRepeated'), ReplaceRepeated);
  setAttrs(sym('ReplaceRepeated'), ["Protected"].map(sym));

  builtinsTable.set(sym('Rule'), Rule);
  setAttrs(sym('Rule'), ["Protected"].map(sym));

  builtinsTable.set(sym('RuleDelayed'), RuleDelayed);
  setAttrs(sym('RuleDelayed'), ["HoldRest", "Protected"].map(sym));

  // Values (Own, Down)
  builtinsTable.set(sym('Set'), Set_);
  setAttrs(sym('Set'), ["HoldFirst", "Protected"].map(sym));

  builtinsTable.set(sym('SetDelayed'), SetDelayed);
  setAttrs(sym('SetDelayed'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('OwnValues'), OwnValues);
  setAttrs(sym('OwnValues'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('DownValues'), DownValues);
  setAttrs(sym('DownValues'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('Clear'), Clear);
  setAttrs(sym('Clear'), ["HoldAll", "Protected"].map(sym));

  // evaluation control
  builtinsTable.set(sym('Hold'), Hold);
  setAttrs(sym('Hold'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('CompoundExpression'), CompoundExpression);
  setAttrs(sym('CompoundExpression'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('Do'), Do);
  setAttrs(sym('Do'), ["HoldAll", "Protected"].map(sym));

  builtinsTable.set(sym('Timing'), Timing);
  setAttrs(sym('Timing'), ["HoldAll", "Protected"].map(sym));

  // Misc
  builtinsTable.set(sym('ToString'), ToString);
  setAttrs(sym('ToString'), ["Protected"].map(sym));

  builtinsTable.set(sym('StringJoin'), StringJoin);
  setAttrs(sym('StringJoin'), ["Flat", "Protected"].map(sym));
}

/*
  Attributes
*/
const Attributes = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Attributes', 1, parts.length);
  }

  if (isSymbol(parts[0])) {
    return list(attrs(parts[0]));
  } else if (isList(parts[0])) {
    return list(parts[0].parts.map(x => {
      if (isSymbol(x)) {
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
    if (!(isSymbol(s))) {
      throw errArgType('SetAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  })

  const attrs = (isList(parts[1]) ? parts[1].parts : [parts[1]]).map(s => {
    if (!(isSymbol(s))) {
      throw errArgType('SetAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  });

  for (const sym of syms) {
    setAttrs(sym, attrs);
  }

  return sym('Null');
}

const ClearAttributes = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('ClearAttributes', 2, parts.length);
  }
  let syms = (isList(parts[0]) ? parts[0].parts : [parts[0]]).map(s => {
    if (!(isSymbol(s))) {
      throw errArgType('ClearAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  })

  const attrs = (isList(parts[1]) ? parts[1].parts : [parts[1]]).map(s => {
    if (!(isSymbol(s))) {
      throw errArgType('ClearAttributes', ['a symbol', 'a list of symbols']);
    }
    return s;
  });

  for (const sym of syms) {
    clearAttrs(sym, attrs);
  }

  return sym('Null');
}

/*
  Number operations
*/
const Plus = (parts: Expr[]) => {
  let acc: number = 0;
  let rest: Expr[] = [];
  for (const part of parts) {
    if (isInteger(part)) {
      acc += part.val;
    } else {
      rest.push(part);
    }
  }

  if (rest.length == 0) {
    return int(acc);
  } else if (acc == 0 && rest.length == 1) {
    return rest[0];
  } else {
    return form(sym("Plus"), acc == 0 ? rest : [int(acc), ...rest]);
  }
}

const Times = (parts: Expr[]) => {
  let acc: number = 1;
  let rest: Expr[] = [];
  for (const part of parts) {
    if (isInteger(part)) {
      acc *= part.val;
    } else {
      rest.push(part);
    }
  }

  if (acc == 0) {
    return int(0);
  }

  if (rest.length == 0) {
    return int(acc);
  } else if (acc == 1 && rest.length == 1) {
    return rest[0];
  } else {
    return form(sym("Times"), acc == 1 ? rest : [int(acc), ...rest]);
  }
}

const Minus = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Minus', 1, parts.length);
  }

  if (isInteger(parts[0])) {
    return int(-parts[0].val);
  } else {
    return form(sym("Times"), [int(-1), parts[0]]);
  }
}

const Power = (parts: Expr[], self: Expr) => {
  if (parts.length != 2) {
    throw errArgCount('Power', 2, parts.length);
  }

  if (isInteger(parts[0])
    && parts[0].val == 0
    && isInteger(parts[1])
    && parts[1].val == 0)
  {
    throw "Indeterminate expression";
  }

  if (isInteger(parts[0]) && parts[0].val == 1) {
    return int(1);
  }

  if (isInteger(parts[1])) {
    if (parts[1].val == 0) {
      return int(1);
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

  return sym(isInteger(parts[0]) ? 'True' : 'False');
}

/*
  Form manipulation
*/
export const Head = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Head', 1, parts.length);
  }

  const e = parts[0];
  return dispatch(e, {
    Integer: () => sym("Integer"),
    Symbol: () => sym("Symbol"),
    String: () => sym("String"),
    Form: () => (e as Form).head,
  });
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
    return sym("False");
  }

  // Uncomment to debug environment
  for (const k of Array.from(env.keys())) {
    //console.log(`${k.repr()} -> ${env.get(k)!.repr()}`);
  }

  return sym("True");
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
  if (parts.length == 1 && !isSymbol(parts[0])) {
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
  return sym('Null');
}

const SetDelayed = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('SetDelayed', 2, parts.length);
  }

  assign(parts[0], parts[1]);
  return sym('Null');
}

const OwnValues = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('OwnValues', 1, parts.length);
  }

  if (!isSymbol(parts[0])) {
    throw errArgType('OwnValues', ['a symbol']);
  }

  return list(ownValues.get(parts[0]) || []);
}

const DownValues = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('DownValues', 1, parts.length);
  }

  if (!isSymbol(parts[0])) {
    throw errArgType('DownValues', ['a symbol']);
  }

  return list(downValues.get(parts[0]) || []);
}

const Clear = (parts: Expr[]) => {
  let doerr = false;
  for (const s of parts) {
    if (!isSymbol(s)) {
      doerr = true;
      continue;
    }
    ownValues.delete(s);
    downValues.delete(s);
  }

  if (doerr) {
    throw "Symbols only please."
  }
  return sym("Null");
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
  let res: Expr = sym("Null");
  for (const part of parts) {
    res = eval_(part, new Map());
  }
  return res;
}

const Do = (parts: Expr[]) => {
  if (parts.length != 2) {
    throw errArgCount('Do', 2, parts.length);
  }

  if (!isInteger(parts[1])) {
    throw errArgType("Do", ["an integer"]);
  }

  const emptyEnv = new Map();
  let res: Expr = sym("Null");
  for (let i = 0; i < parts[1].val; i++) {
    res = eval_(parts[0], emptyEnv);
  }

  return res;
}

const Timing = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('Timing', 1, parts.length);
  }

  const env = new Map();

  const startTime = process.cpuUsage();
  const res = eval_(parts[0], env);
  const diffTime = process.cpuUsage(startTime);

  const cpuInUs = diffTime.user + diffTime.system;
  return form(sym("List"), [int(cpuInUs / 1_000_000), res]);
}

/*
  Misc
*/
const ToString = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw errArgCount('ToString', 1, parts.length);
  }

  return str(repr(parts[0]));
}

const StringJoin = (parts: Expr[]) => {
  return str(parts.map(p => {
    if (!isString(p)) {
      throw errArgType('StringJoin', ['a String']);
    }
    return p.val
  }).join(''));
}

/*
  Error msg utils
*/
const errArgCount = (fnname: string, expected: number | string, actual: number) =>
  `${fnname} called with ${actual} arguments; ${expected} argument is expected.`;

const errArgType = (fnname: string, types: string[]) =>
  `${fnname} expects ${types.join(" or ")}.`;
