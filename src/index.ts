import { createInterface, Interface } from 'readline';
import { expr } from './wl/grammar';
import { fromString } from './parser/stream';

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
      console.log(parsed.res.repr());
    }
  }
}

main();