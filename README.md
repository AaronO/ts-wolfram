
This is a toy Wolfram/Mathematica language interpreter written in
Typescript.

The goal of the project is for me to develop a better understanding of
exactly how Mathematica works. I first wrote a toy differentiator in
Mathematica that's good enough to differentiate many simple functions
from a standard single variable calculus textbook:

```wl
D[_?NumberQ, x_Symbol] = 0;
D[x_, x_Symbol] = 1;
D[Times[expr1_, expr2_], x_Symbol] =
  D[expr1, x] expr2 + D[expr2, x] expr1;
D[Plus[expr1_, expr2_], x_Symbol] = D[expr1, x] + D[expr2, x];
D[Sin[x_], x_Symbol] = Cos[x];
D[Cos[x_], x_Symbol] = -Sin[x];
D[f_Symbol[expr_], x_Symbol] :=
  (D[f[x], x] /. x -> expr) * D[expr, x];
D[Power[expr_, p_Integer], x_Symbol] := p expr^(p - 1) * D[expr, x];
```

The `ts-wolfram` project implements enough of the Wolfram Language to
successfully (and correctly) evaluate `D` on the following examples:

```wl
D[1, x],
D[x, x],
D[x^5, x],
D[3 x^2, x],
D[(x + 1) (x + 2), x],
D[x^2 + x^3, x],
D[Cos[x], x],
D[x^3/(x^2 + 1), x],
D[Cos[Cos[x]], x],
D[Cos[Cos[Cos[x]]], x],
D[Cos[x^2 + 1], x],
D[(x + 1)^2, x]
```

This has been a really fun and instructive project. Supported features
are:

- __Literals__: parses integers, symbols, forms, arithmetic operators,
  and lists. Multiplication is parsed correctly (i.e. `a*b` and `a b`
  both parse as `Times[a,b]`).
- __Attributes__: `HoldFirst`, `HoldRest`, `HoldAll`, `Protected`,
  `Flat`. Also the builtins `Attributes`, `SetAttributes`,
  `ClearAttributes`.
- __Field operators__: `Plus`, `Times`.

The list above is also a reasonably good indicator of the order in which
the features were implemented.
