import { fwd, ok, str } from "../src/parser/base";
import { either, int, binop } from "../src/parser/lib";
import { fromString } from "../src/parser/stream";

const term = fwd(() => binop(factor, either(str('+'), str('-'))));
const factor = binop(int, either(str('*'), str('/')));

it('', () => {
  expect(term(fromString("1+2"))).toEqual(ok(['+', 1, 2]));
  expect(term(fromString("1+2+3"))).toEqual(ok(['+', ['+', 1, 2], 3]));
  expect(term(fromString("1+2*3"))).toEqual(ok(['+', 1, ['*', 2, 3]]));
});
