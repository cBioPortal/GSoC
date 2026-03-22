---
title: Strided Arrays
sidebar_position: 3
---

# Strided Arrays

A strided array is a way to store and access multidimensional data in a flat, contiguous block of memory. Instead of using nested arrays or pointers, a single buffer holds all the elements, and a set of **strides** determines how to jump between elements along each dimension.

## Core idea

Given a flat buffer and an element at index `(i, j, k, ...)`, the byte offset is:

```
offset = (i * stride[0]) + (j * stride[1]) + (k * stride[2]) + ...
```

Each stride value tells you how many bytes to skip to move one step along that axis.

## Example

A 3x4 matrix of 8-byte floats stored in row-major (C) order:

```
shape:   (3, 4)
strides: (32, 8)
```

- Moving one column to the right (axis 1): skip 8 bytes (one float)
- Moving one row down (axis 0): skip 32 bytes (4 floats × 8 bytes)

The element at `(2, 1)` lives at byte offset `2*32 + 1*8 = 72`.

## Row-major vs column-major

The two common memory layouts differ only in their stride order:

| Layout | Also called | Strides for (3, 4) of float64 | First axis varies |
|---|---|---|---|
| Row-major | C order | (32, 8) | Slowest |
| Column-major | Fortran order | (8, 24) | Fastest |

NumPy defaults to row-major. Fortran and MATLAB use column-major.

## Why strides matter

Strides make several operations possible **without copying data**:

- **Slicing** — a slice like `a[::2, :]` just doubles the stride along axis 0
- **Transposing** — swapping axes is just swapping their strides
- **Broadcasting** — a stride of 0 along an axis repeats that dimension's data for free
- **Reshaping** — sometimes just a reinterpretation of strides with no data movement

These zero-copy operations are why NumPy, PyTorch, and similar libraries are built around strided arrays.

## Limitations

- **Non-contiguous views** can hurt cache performance since memory accesses may jump around
- **Not all reshapes are free** — if the data isn't contiguous in the right way, a copy is required
- The strided model assumes dense, regularly-spaced data — it doesn't natively handle sparse or compressed layouts

## Further reading

- [Stride Guide Part 1](https://ajcr.net/stride-guide-part-1/)
- [Stride Guide Part 2](https://ajcr.net/stride-guide-part-2/)
- [Stride Guide Part 3](https://ajcr.net/stride-guide-part-3/)
