import { createInterface, Interface } from 'readline';
import { expr } from './grammar';
import { fromString } from '@spakhm/ts-parsec';
import { populateBuiltins } from './builtins';
import { symbol } from './symbols';

function q(rl: Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

const main = async () => {
  populateBuiltins();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const a = await q(rl, '> ');
    const parsed = expr(fromString(a));
    if (parsed.type == 'err') {
      console.log("Parsing error");
      continue;
    }
    
    try {
      const evaled = parsed.res.eval();
      if (evaled != symbol('Null')) {
        console.log(evaled.repr());
      }
    } catch (err) {
      console.log(err);
    }
  }
}

main();