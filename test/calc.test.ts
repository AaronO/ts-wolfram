import { ok, parserlike, str } from "../src/parser/base";
import { either, int, many, seq } from "../src/parser/lib";
import { fromString, stream } from "../src/parser/stream";

type expr = ['+' | '-' | '*' | '/', expr, expr] | number;

const term: parserlike<expr> = (source: stream) => {
  const p = seq(factor, many(seq(either(str('+'), str('-')), factor))).map2<expr>((left, rights) => {
    return rights.reduce<expr>((acc, [op, right]) => [op, acc, right], left);
  });
  return p(source);
}

const factor: parserlike<expr> = (source: stream) => {
  const p = seq(int, many(seq(either(str('*'), str('/')), int))).map2<expr>((left, rights) => {
    return rights.reduce<expr>((acc, [op, right]) => [op, acc, right], left);
  });
  return p(source);
}

it('', () => {
  expect(term(fromString("1+2"))).toEqual(ok(['+', 1, 2]));
  expect(term(fromString("1+2+3"))).toEqual(ok(['+', ['+', 1, 2], 3]));
  expect(term(fromString("1+2*3"))).toEqual(ok(['+', 1, ['*', 2, 3]]));
});
