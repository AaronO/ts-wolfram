import { attrs } from './attrs';
import { symbol } from './symbols';
import { builtin } from './builtins';

export type Expr = Form | Symbol | Int;

export interface Node {
  eval: () => Expr,
  repr: () => string,
}

export class Form implements Node {
  constructor(
    public head: Expr,
    public parts: Expr[],
  ) {}

  eval(): Expr {
    const head_ = this.head.eval();
    
    let parts_: Expr[];
    if (head_ instanceof Symbol && this.parts.length > 0) {
      const first =
        (attrs(head_).includes(symbol("HoldFirst"))
        || attrs(head_).includes(symbol("HoldAll")))
          ? this.parts[0] : this.parts[0].eval();

      const rest =
        (attrs(head_).includes(symbol("HoldRest"))
        || attrs(head_).includes(symbol("HoldAll")))
          ? this.parts.slice(1) : this.parts.slice(1).map(el => el.eval());

      parts_ = [first, ...rest];
    } else {
      parts_ = this.parts.map(el => el.eval());
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

    const fn = builtin(head_);
    if (fn) {
      return fn(parts_);
    }

    // TODO: check DownValues

    return new Form(head_, parts_);
  };

  repr(): string {
    return `${this.head.repr()}[${this.parts.map(x => x.repr()).join(", ")}]`;
  }
}

export class Symbol implements Node {
  constructor(public val: string) {}
  eval (): Expr {
    // TODO: check OwnValues
    return this;
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
