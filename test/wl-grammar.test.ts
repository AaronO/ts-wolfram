import { ok } from '../src/parser/base';
import { fromString } from '../src/parser/stream';
import { expr } from '../src/grammar';

it('', () => {
  expect(expr(fromString('Abc[foo,12]'))).toEqual(ok({ type: 'form',
    head: {type: 'symbol', value: 'Abc'},
    parts: [
      { type: 'symbol', value: 'foo'} ,
      { type: 'int', value: 12}
    ]
  }));
});
