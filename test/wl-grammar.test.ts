import { ok } from '../src/parser/base';
import { fromString } from '../src/parser/stream';
import { expr } from '../src/wl/grammar';
import { Form, Int, Symbol } from '../src/wl/ast';

it('', () => {
  expect(expr(fromString('Abc[foo, 12]'))).toEqual(ok(new Form(new Symbol("Abc"),
    [new Symbol("foo"), new Int(12)])));
});
