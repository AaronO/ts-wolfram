import { ok } from '../src/parser/base';
import { fromString } from '../src/parser/stream';
import { expr } from '../src/grammar';

it('', () => {
  expect(expr(fromString('abc[]'))).toEqual(ok({ head: 'abc', parts: [] }));
  expect(expr(fromString('Abc[]'))).toEqual(ok({ head: 'Abc', parts: [] }));
  expect(expr(fromString('Abc[foo]'))).toEqual(ok({ head: 'Abc', parts: ['foo'] }));
  expect(expr(fromString('Abc[12]'))).toEqual(ok({ head: 'Abc', parts: [12] }));
  expect(expr(fromString('Abc[foo,12]'))).toEqual(ok({ head: 'Abc', parts: ['foo', 12] }));
});
