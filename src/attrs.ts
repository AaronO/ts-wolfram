import type { Symbol } from './ast';
import { sym } from './ast';

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
export const attrs = (sym_: Symbol) => {
  const attrVec = getVec(sym_);
  const attrs_: Symbol[] = [];
  if (attrVec.holdFirst && attrVec.holdRest) {
    attrs_.push(sym('HoldAll'));
  } else {
    if (attrVec.holdFirst) { attrs_.push(sym('HoldFirst')); }
    if (attrVec.holdRest) { attrs_.push(sym('HoldRest')); }
  }
  if (attrVec.protected) { attrs_.push(sym('Protected')); }
  if (attrVec.flat) { attrs_.push(sym('Flat')); }
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
  Clear attributes
*/
export const clearAttrs = (sym: Symbol, attrs_: Symbol[]) => {
  for(const attr of attrs_) {
    validate(attr);
  }

  const attrVec = getVec(sym);
  for (const attr of attrs_) {
    if (attr.val == 'HoldFirst') { attrVec.holdFirst = false; }
    if (attr.val == 'HoldRest') { attrVec.holdRest = false; }
    if (attr.val == 'HoldAll') {
      attrVec.holdFirst = false;
      attrVec.holdRest = false;
    }
    if (attr.val == 'Protected') { attrVec.protected = false; }
    if (attr.val == 'Flat') { attrVec.flat = false; }
  }
  attrsTable.set(sym, attrVec);
}

/*
  Utils
*/
const validate = (sym_: Symbol) => {
  if (!supported.map(sym).includes(sym_)) {
    throw `${sym_.val} is not a known attribute.`;
  }
}

const getVec = (sym: Symbol) => attrsTable.get(sym) || {
  holdFirst: false,
  holdRest: false,
  protected: false,
  flat: false,
};
