import { attrs } from './attrs';
import { symbol } from './symbols';
import { builtin } from './builtins';
import { replaceRepeated, rulesToPairs, Env } from './rewrite';
import { downValues, ownValues } from './values';
import { isSymbol } from 'lodash';

export type Expr = Form | Symbol | Int;

export interface Node {
  eval: (localEnv: Env) => Expr,
  repr: () => string,
}

export class Form implements Node {
  constructor(
    public head: Expr,
    public parts: Expr[],
  ) {}

  eval(localEnv: Env): Expr {
    const head_ = this.head.eval(localEnv);
    
    let parts_: Expr[];
    if (head_ instanceof Symbol && this.parts.length > 0) {
      const first =
        (attrs(head_).includes(symbol("HoldFirst"))
        || attrs(head_).includes(symbol("HoldAll")))
          ? this.parts[0] : this.parts[0].eval(localEnv);

      const rest =
        (attrs(head_).includes(symbol("HoldRest"))
        || attrs(head_).includes(symbol("HoldAll")))
          ? this.parts.slice(1) : this.parts.slice(1).map(el => el.eval(localEnv));

      parts_ = [first, ...rest];
    } else {
      parts_ = this.parts.map(el => el.eval(localEnv));
    }

    if (!(head_ instanceof Symbol)) {
      return new Form(head_, parts_);
    }

    if (attrs(head_).includes(symbol("Flat"))) {
      let parts2: Expr[] = [];
      for (const part of parts_) {
        if (part instanceof Form && part.head instanceof Symbol && part.head.val === head_.val) {
          parts2 = [...parts2, ...part.parts];
        } else {
          parts2 = [...parts2, part];
        }
      }
      parts_ = parts2;
    }

    let evaled: Expr = new Form(head_, parts_);

    // check DownValues
    const downvals = downValues.get(head_);
    evaled = downvals ? replaceRepeated(evaled, rulesToPairs(downvals)) : evaled;

    // Check builtins
    if (evaled instanceof Form && evaled.head instanceof Symbol) {
      const fn = builtin(evaled.head);
      if (fn) {
        evaled = fn(evaled.parts, evaled);
      }
    }

    return evaled;
  };

  repr(): string {
    return `${this.head.repr()}[${this.parts.map(x => x.repr()).join(", ")}]`;
  }
}

export class Symbol implements Node {
  constructor(public val: string) {}
  eval (localEnv: Env): Expr {
    if (localEnv.has(this)) {
      return localEnv.get(this)!;
    }

    const ownvals = ownValues.get(this);
    return ownvals ? replaceRepeated(this, rulesToPairs(ownvals)) : this;
  }

  repr (): string {
    return this.val;
  }
}

export class Int implements Node {
  constructor(public val: number) {}
  eval(): Expr {
    return this;
  }

  repr (): string {
    return this.val.toString();
  }
}
