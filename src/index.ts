import { createInterface, Interface } from 'readline';
import { expr } from './grammar';
import { fromString } from '@spakhm/ts-parsec';
import { populateBuiltins } from './builtins';
import { eval_ } from './ast';
import { Expr, sym } from './expr';
import { promises as fs } from 'fs';
import { repr } from './repr';
import { loadWlFile } from './loader';

const main = async () => {
  populateBuiltins();
  await loadWlFile(__dirname, 'prelude.wl');

  const args = process.argv.slice(2);
  if (args.length > 0) {
    console.log(`Running file ${args[0]}`);
    await runFile(args[0]);
  } else {
    await runRepl();
  }
}

const runFile = async (filePath: string) => {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const lines = fileContent.split('\n');
  const emptyEnv = new Map();
  let lastResult: Expr = sym('Null');

  for (const line of lines) {
    if (line.trim() === '') continue;

    const parsed = expr(fromString(line));
    if (parsed.type == 'err') {
      console.log(`Parsing error in line: ${line}`);
      continue;
    }

    try {
      lastResult = eval_(parsed.res, emptyEnv);
    } catch (err) {
      console.log(`Error evaluating line: ${line}`);
      console.log(err);
    }
  }

  if (lastResult != sym('Null')) {
    console.log(repr(lastResult));
  }
}

const runRepl = async () => {
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
      const evaled = eval_(parsed.res, emptyEnv);
      if (evaled != sym('Null')) {
        console.log(repr(evaled));
      }
    } catch (err) {
      console.log(err);
    }
  }
}

function q(rl: Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

main();