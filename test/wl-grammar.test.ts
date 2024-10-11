import { ok } from '../src/parser/base';
import { fromString } from '../src/parser/stream';
import { form } from '../src/grammar';

it('', () => {
  expect(form(fromString('abc[]'))).toEqual(ok({ head: 'abc', parts: [] }));
  expect(form(fromString('Abc[]'))).toEqual(ok({ head: 'Abc', parts: [] }));
  expect(form(fromString('Abc[foo]'))).toEqual(ok({ head: 'Abc', parts: ['foo'] }));
  expect(form(fromString('Abc[12]'))).toEqual(ok({ head: 'Abc', parts: [12] }));
  expect(form(fromString('Abc[foo,12]'))).toEqual(ok({ head: 'Abc', parts: ['foo', 12] }));
});