
export type Expr = Form | Symbol | Int;

export class Form {
  constructor(
    public head: Symbol,
    public parts: Expr[],
  ) {}

  eval() {

  };
}

export class Symbol {
  constructor(public val: string) {}
  eval () {
    return this;
  }
}

export class Int {
  constructor(public val: number) {}
  eval() {
    return this;
  }
}
