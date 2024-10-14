import { createInterface, Interface } from 'readline';
import { expr } from './grammar';
import { fromString } from '@spakhm/ts-parsec';

function q(rl: Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

const main = async () => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const a = await q(rl, '> ');
    const parsed = expr(fromString(a));
    if (parsed.type == 'err') {
      console.log("Parsing error");
    } else {
      console.log(parsed.res.eval().repr());
    }
  }
}

main();