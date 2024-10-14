import { Symbol, Expr, List } from './ast';
import { symbol } from './symbols';
import { attrs, setAttrs } from './attrs';

type Builtin = (parts: Expr[]) => Expr;
const builtinsTable: Map<Symbol, Builtin> = new Map();

export const builtin = (sym: Symbol): Builtin | undefined => builtinsTable.get(sym);

export const populateBuiltins = () => {
  builtinsTable.set(symbol('Attributes'), Attributes);
  setAttrs(symbol('Attributes'), ["HoldAll", "Protected"].map(symbol));
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
