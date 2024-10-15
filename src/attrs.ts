import type { Symbol } from './ast';
import { symbol } from './symbols';

type AttrVec = {
  holdFirst: boolean,
  holdRest: boolean,
  protected: boolean,
  flat: boolean,
}
const attrsTable: Map<Symbol, AttrVec> = new Map();

const supported = ['HoldFirst', 'HoldRest', 'HoldAll', 'Protected', 'Flat'];

/*
  Get attributes
*/
export const attrs = (sym: Symbol) => {
  const attrVec = getVec(sym);
  const attrs_: Symbol[] = [];
  if (attrVec.holdFirst && attrVec.holdRest) {
    attrs_.push(symbol('HoldAll'));
  } else {
    if (attrVec.holdFirst) { attrs_.push(symbol('HoldFirst')); }
    if (attrVec.holdRest) { attrs_.push(symbol('HoldRest')); }
  }
  if (attrVec.protected) { attrs_.push(symbol('Protected')); }
  if (attrVec.flat) { attrs_.push(symbol('Flat')); }
  return attrs_;
}

/*
  Set attributes
*/
export const setAttrs = (sym: Symbol, attrs_: Symbol[]) => {
  for(const attr of attrs_) {
    validate(attr);
  }

  const attrVec = getVec(sym);
  for (const attr of attrs_) {
    if (attr.val == 'HoldFirst') { attrVec.holdFirst = true; }
    if (attr.val == 'HoldRest') { attrVec.holdRest = true; }
    if (attr.val == 'HoldAll') {
      attrVec.holdFirst = true;
      attrVec.holdRest = true;
    }
    if (attr.val == 'Protected') { attrVec.protected = true; }
    if (attr.val == 'Flat') { attrVec.flat = true; }
  }
  attrsTable.set(sym, attrVec);
}

/*
  Utils
*/
const validate = (sym: Symbol) => {
  if (!supported.map(symbol).includes(sym)) {
    throw `${sym.val} is not a known attribute.`;
  }
}

const getVec = (sym: Symbol) => attrsTable.get(sym) || {
  holdFirst: false,
  holdRest: false,
  protected: false,
  flat: false,
};
