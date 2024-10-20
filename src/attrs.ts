import type { Symbol } from './ast';
import { sym } from './ast';

export type AttrVec = {
  holdFirst?: boolean,
  holdRest?: boolean,
  protected?: boolean,
  flat?: boolean,
}

const supported = ['HoldFirst', 'HoldRest', 'HoldAll', 'Protected', 'Flat'];

/*
  Get attributes
*/
export const attrs = (sym_: Symbol) => {
  const attrVec = sym_.attrs;
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

  const attrVec = sym.attrs;
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
  sym.attrs = attrVec;
}

/*
  Clear attributes
*/
export const clearAttrs = (sym: Symbol, attrs_: Symbol[]) => {
  for(const attr of attrs_) {
    validate(attr);
  }

  const attrVec = sym.attrs;
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
  sym.attrs = attrVec;
}

/*
  Utils
*/
const validate = (sym_: Symbol) => {
  if (!supported.map(sym).includes(sym_)) {
    throw `${sym_.val} is not a known attribute.`;
  }
}
