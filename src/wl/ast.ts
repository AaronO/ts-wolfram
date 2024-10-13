
//export type Expr = Form | Symbol | Int;

export type Expr = Form | Symbol | Int;

export interface Node {
  eval: () => Expr,
  repr: () => string,
}

export class Form implements Node {
  constructor(
    public head: Symbol,
    public parts: Expr[],
  ) {}

  eval() {
    return this;
  };

  repr(): string {
    return `${this.head.val}[${this.parts.map(x => x.repr()).join(", ")}]`;
  }
}

export class Symbol implements Node {
  constructor(public val: string) {}
  eval () {
    return this;
  }

  repr (): string {
    return this.val;
  }
}

export class Int implements Node {
  constructor(public val: number) {}
  eval() {
    return this;
  }

  repr (): string {
    return this.val.toString();
  }
}
