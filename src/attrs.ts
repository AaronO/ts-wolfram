import type { Symbol } from './ast';
import { symbol } from './symbols';
import uniq from 'lodash/uniq';

const attrsTable: Map<Symbol, Symbol[]> = new Map();

const supported = ['HoldFirst', 'HoldRest', 'HoldAll', 'Protected', 'Flat'];

export const attrs = (sym: Symbol) => attrsTable.get(sym) || [];
export const setAttrs = (sym: Symbol, attrs_: Symbol[]) => {
  for(const attr of attrs_) {
    validate(attr);
  }
  attrsTable.set(sym, uniq([...attrs(sym), ...attrs_]));
}

const validate = (sym: Symbol) => {
  if (!supported.map(symbol).includes(sym)) {
    throw `${sym.val} is not a known attribute.`;
  }
}
