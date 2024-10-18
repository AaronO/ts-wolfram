D[_?NumberQ, x_Symbol] = 0;
D[Times[expr1_, expr2_], x_Symbol] =
  D[expr1, x] expr2 + D[expr2, x] expr1;
D[Plus[expr1_, expr2_], x_Symbol] = D[expr1, x] + D[expr2, x];
D[Sin[x_], x_Symbol] = Cos[x];
D[Cos[x_], x_Symbol] = -Sin[x];
D[Power[expr_, p_Integer], x_Symbol] := p expr^(p - 1) * D[expr, x];
D[f_Symbol[expr_], x_Symbol] :=
  (D[f[x], x] /. x -> expr) * D[expr, x];
D[x_, x_Symbol] = 1;