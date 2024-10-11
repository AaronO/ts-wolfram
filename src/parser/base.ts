import type { stream } from './stream';

/*
  Result handling
*/
export type result<T, E> = { type: 'ok', res: T, } | { type: 'err', err: E, };
export type parser_error = { row: number, col: number, msg: string, };

export const ok = <T>(res: T): result<T, never> => ({ type: 'ok', res, });
export const err = (row: number, col: number, msg: string): result<never, parser_error> =>
  ({ type: 'err', err: { row, col, msg, }});

/*
  Parser types
*/
export type parserFn<T> = (source: stream) => result<T, parser_error>;
export type parser<T> = parserFn<T> & {
  map: <U>(fn: ((value: T) => U)) => parser<U>,
};
export type thunk<T> = () => parser<T>;
export type parserlike<T> = parserFn<T> | parser<T> | string | thunk<T>;

/*
  Allowing functions and strings to act like parsers
*/
export function toParser<T>(p: parserlike<T>): parser<T>;
export function toParser <T>(pl: parserlike<T>): parser<T> | parser<string> {
  if (typeof pl == 'string') {
    return str(pl);
  }

  if ('map' in pl) {
    return pl;
  }

  if (pl.length == 0) {
    return toParser((pl as thunk<T>)());
  }

  const fn_: parser<T> = pl as parser<T>;

  fn_.map = <U>(fnTransform: (value: T) => U): parser<U> => {
    return toParser((source: stream): result<U, parser_error> => {
      const res = fn_(source);
      if (res.type == 'ok') {
        return ok(fnTransform(res.res));
      } else {
        return res;
      }
    });
  };

  return fn_;
}

/*
  The most basic of parsers
*/
export const str = <T extends string>(match: T): parser<T> =>
  toParser((source: stream) => {
    for (let i = 0; i < match.length; i++) {
      if(source.next() != match[i]) {
        return err(0, 0, '');
      }
    }
    return ok(match);
  });
