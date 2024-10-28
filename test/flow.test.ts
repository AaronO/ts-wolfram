import { expr } from '../src/grammar';
import { eval_ } from '../src/ast';
import { fromString } from '@spakhm/ts-parsec';
import { repr } from '../src/repr';
import { populateBuiltins } from '../src/builtins';

describe('Control flow', () => {
  beforeEach(() => {
    populateBuiltins();
  });

  describe('If', () => {
    it('evaluates true condition', () => {
      expect(e("If[True, 1, 2]")).toEqual("1");
    });

    it('evaluates false condition', () => {
      expect(e("If[False, 1, 2]")).toEqual("2"); 
    });

    it('returns Null when no false branch', () => {
      expect(e("If[False, 1]")).toEqual("Null");
    });

    it('evaluates condition', () => {
      expect(e("If[1 == 1, 1, 2]")).toEqual("1");
      expect(e("If[1 == 2, 1, 2]")).toEqual("2");
    });
  });

  describe('Switch', () => {
    it('matches first pattern', () => {
      expect(e("Switch[1, 1, \"one\", 2, \"two\"]")).toEqual("one");
    });

    it('matches later pattern', () => {
      expect(e("Switch[2, 1, \"one\", 2, \"two\"]")).toEqual("two");
    });

    it('returns default case', () => {
      expect(e("Switch[3, 1, \"one\", 2, \"two\", \"default\"]")).toEqual("default");
    });

    it('returns Null when no match', () => {
      expect(e("Switch[3, 1, \"one\", 2, \"two\"]")).toEqual("Null");
    });

    it('evaluates expression', () => {
      expect(e("Switch[1 + 1, 2, \"two\"]")).toEqual("two");
    });
  });
});

const e = (code: string): string => {
  const parsed = expr(fromString(code));
  if (parsed.type == 'err') {
    throw "Error parsing";
  }

  const evaled = eval_(parsed.res, new Map());
  return repr(evaled);
}
