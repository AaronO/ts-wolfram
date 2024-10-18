import { createInterface, Interface } from 'readline';
import { expr } from './grammar';
import { fromString } from '@spakhm/ts-parsec';
import { populateBuiltins } from './builtins';
import { symbol } from './symbols';
import { promises as fs } from 'fs';
import * as path from 'path';

function q(rl: Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

const main = async () => {
  populateBuiltins();
  const prelude = expr(fromString(await fs.readFile(path.resolve(__dirname, 'prelude.wl'), 'utf8')));
  if (prelude.type == 'err') {
    throw "Couldn't load prelude";
  } else {
    prelude.res.eval(new Map());
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const emptyEnv = new Map();
  while (true) {
    const a = await q(rl, '> ');
    const parsed = expr(fromString(a));
    if (parsed.type == 'err') {
      console.log("Parsing error");
      continue;
    }
    
    try {
      const evaled = parsed.res.eval(emptyEnv);
      if (evaled != symbol('Null')) {
        console.log(evaled.repr());
      }
    } catch (err) {
      console.log(err);
    }
  }
}

main();