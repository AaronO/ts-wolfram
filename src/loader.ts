import { expr } from './grammar';
import { fromString } from '@spakhm/ts-parsec';
import { eval_ } from './ast';
import { promises as fs } from 'fs';
import * as path from 'path';
import { withUnprotected } from './values';

export const loadWlFile = async (...paths: string[]) => {
  const resolved = path.resolve(...paths);
  const prelude = expr(fromString(await fs.readFile(resolved, 'utf8')));
  if (prelude.type == 'err') {
    throw "Couldn't load prelude";
  }
  withUnprotected(() => eval_(prelude.res, new Map()));
}

