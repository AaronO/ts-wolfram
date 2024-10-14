import type { Symbol, Expr } from './ast';
import { symbol } from './symbols';
import { attrs } from './attrs';

type Builtin = (parts: Expr[]) => Expr;
const builtinsTable: Map<Symbol, Builtin> = new Map();

export const builtin = (sym: Symbol): Builtin | undefined => builtinsTable.get(sym);

export const populateBuiltins = () => {
  builtinsTable.set(symbol('Attributes'), Attributes);
}

const Attributes = (parts: Expr[]) => {
  if (parts.length != 1) {
    throw `Attributes called with ${parts.length} arguments; 1 argument is expected.`;
  }
  //attrs(parts[0]);
  return symbol("foo");
}
