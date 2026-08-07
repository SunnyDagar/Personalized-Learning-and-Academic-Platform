# Sample course material — recursion and search

A small stand-in for a professor's uploaded notes, so the pipeline can be demonstrated end to end
without needing a real course file or an API key:

```bash
python3 cli/ingest_cli.py notes.md --dry-run --query "what stops a recursion?"   # answers
python3 cli/ingest_cli.py notes.md --dry-run --query "who won the match?"        # refuses
```

## Recursion

A recursive function is one that calls itself with a smaller version of the same problem. Every
recursive function needs two parts: a base case and a recursive case.

The base case is the condition that stops the recursion. Without a base case the function calls
itself forever and the program runs out of stack space, which is reported as a stack overflow.

The recursive case reduces the problem towards the base case. If each call does not move closer to
the base case, the recursion will not terminate even though a base case exists.

Factorial is the standard example. The factorial of zero is one, which is the base case. The
factorial of any positive number is that number multiplied by the factorial of the number below it.

## Recursion versus iteration

Any recursive function can be rewritten as a loop, and any loop can be rewritten recursively.
Recursion is usually clearer for problems that are themselves defined recursively, such as walking a
tree. Iteration is usually cheaper, because each recursive call consumes a stack frame.

Tail recursion is a special case where the recursive call is the last operation in the function.
Some languages optimise this into a loop, which removes the stack cost. Python does not.

## Searching

Linear search checks every element in turn and works on unsorted data. In the worst case it examines
every element, so its cost grows in proportion to the size of the input.

Binary search requires sorted data. It compares the target with the middle element and discards half
the remaining range each time, so its cost grows with the logarithm of the input size. Binary search
is naturally recursive: each step is a smaller binary search over half the range.

The base case for binary search is an empty range, which means the target is not present.

## Complexity

Big-O notation describes how the cost of an algorithm grows as the input grows. It describes the
shape of the growth rather than an exact time, so constant factors are ignored.

Linear search is O(n). Binary search is O(log n). A function that calls itself twice for each input,
without reducing the problem, is O(2^n), which becomes impractical very quickly.
