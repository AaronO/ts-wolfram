
import { Symbol } from './ast';

const symtable: Map<string, Symbol> = new Map();

export const symbol = (name: string): Symbol => {
  let sym = symtable.get(name);
  if (sym) {
    return sym;
  } else {
    sym = new Symbol(name);
    symtable.set(name, sym);
    return sym;
  }
}

