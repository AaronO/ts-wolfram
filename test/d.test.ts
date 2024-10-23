import { expr } from '../src/grammar';
import { eval_ } from '../src/ast';
import { fromString } from '@spakhm/ts-parsec';
import { repr } from '../src/repr';
import { loadWlFile } from '../src/loader';
import { populateBuiltins } from '../src/builtins';

it('', async () => {
  populateBuiltins();
  await loadWlFile(__dirname, '..', 'src', 'prelude.wl');

  // Whoever is reading this, I am very sorry for the terrible
  // printing of expressions. This should definitely be improved.
  expect(e("D[1, x]")).toEqual("0");
  expect(e("D[x, x]")).toEqual("1");
  expect(e("D[x^5, x]")).toEqual("5 (Power[x, 4])");
  expect(e("D[3 x^2, x]")).toEqual("6 x");
  expect(e("D[(x + 1) (x + 2), x]")).toEqual("3 + x + x");
  expect(e("D[x^2 + x^3, x]")).toEqual("(2 x) + (3 (Power[x, 2]))");
  expect(e("D[Cos[x], x]")).toEqual("-1 (Sin[x])");
  expect(e("D[x^3/(x^2 + 1), x]")).toEqual(
    "(3 (Power[x, 2]) (Power[1 + (Power[x, 2]), -1])) + (-2 (Power[1 + (Power[x, 2]), -2]) x (Power[x, 3]))"
  );
  expect(e("D[Cos[Cos[x]], x]")).toEqual("(Sin[Cos[x]]) (Sin[x])");
  expect(e("D[Cos[Cos[Cos[x]]], x]")).toEqual("-1 (Sin[Cos[Cos[x]]]) (Sin[Cos[x]]) (Sin[x])");
  expect(e("D[Cos[x^2 + 1], x]")).toEqual("-2 (Sin[1 + (Power[x, 2])]) x");
  expect(e("D[(x + 1)^2, x]")).toEqual("2 (1 + x)");
});

const e = (code: string): string => {
  const parsed = expr(fromString(code));
  if (parsed.type == 'err') {
    throw "Error parsing";
  }

  const evaled = eval_(parsed.res, new Map());
  return repr(evaled);
}
