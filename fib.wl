fib[1] := 1
fib[2] := 1
fib[n_] := fib[n-2] + fib[n-1]

Timing[Do[fib[15], 1000]]
