
This is a toy Wolfram/Mathematica language interpreter written in
Typescript.

The goal of the project is for me to develop a better understanding of
exactly how Mathematica works. I first wrote a toy differentiator in
Mathematica that's good enough to differentiate many simple functions
from a standard single variable calculus textbook:

```wl
Df[_?NumberQ, x_Symbol] = 0;
Df[x_, x_Symbol] = 1;
Df[Times[expr1_, expr2_], x_Symbol] =
  Df[expr1, x] expr2 + Df[expr2, x] expr1;
Df[Plus[expr1_, expr2_], x_Symbol] = Df[expr1, x] + Df[expr2, x];
Df[Sin[x_], x_Symbol] = Cos[x];
Df[Cos[x_], x_Symbol] = -Sin[x];
Df[f_Symbol[expr_], x_Symbol] :=
  (Df[f[x], x] /. x -> expr) * Df[expr, x];
Df[Power[expr_, p_Integer], x_Symbol] := p expr^(p - 1) * Df[expr, x];
```

The `ts-wolfram` project implements enough of the Wolfram Language to
successfully (and correctly) evaluate `Df` on the following examples:

```wl
Df[1, x],
Df[x, x],
Df[x^5, x],
Df[3 x^2, x],
Df[(x + 1) (x + 2), x],
Df[x^2 + x^3, x],
Df[Cos[x], x],
Df[x^3/(x^2 + 1), x],
Df[Cos[Cos[x]], x],
Df[Cos[Cos[Cos[x]]], x],
Df[Cos[x^2 + 1], x],
Df[(x + 1)^2, x]
```

This has been a really fun and instructive project. Supported features
(this list is also a reasonably good indicator of the order in which
the features were implemented):

- __Literals__: parses integers, symbols, forms, arithmetic operators,
  and lists. Multiplication is parsed correctly (i.e. `a*b` and `a b`
  both parse as `Times[a,b]`).
- __Attributes__: `HoldFirst`, `HoldRest`, `HoldAll`, `Protected`,
  along with the builtin `Attributes`.
- __Field operators__: `Plus`, `Times`.
