/**
 * Numeric Bessel function of the first kind J_m(x), computed by the standard
 * power series with an iterative term ratio (stable for m in [0,6], x in [0,40]):
 *   J_m(x) = sum_k (-1)^k / (k! (k+m)!) * (x/2)^(2k+m)
 */
export function besselJ(m: number, x: number): number {
  if (x === 0) return m === 0 ? 1 : 0;
  const halfX = x / 2;
  let term = Math.pow(halfX, m) / factorial(m);
  let sum = term;
  const negHalfXSq = -(halfX * halfX);
  for (let k = 1; k < 60; k++) {
    term *= negHalfXSq / (k * (k + m));
    sum += term;
    if (Math.abs(term) < 1e-14 * Math.abs(sum) + 1e-300) break;
  }
  return sum;
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Finds the first `count` positive roots of J_m by scanning + bisection. */
export function besselJZeros(m: number, count: number): number[] {
  const zeros: number[] = [];
  const step = 0.05;
  let prevX = step;
  let prevVal = besselJ(m, prevX);
  for (let x = step * 2; zeros.length < count && x < 200; x += step) {
    const val = besselJ(m, x);
    if (prevVal === 0 || Math.sign(val) !== Math.sign(prevVal)) {
      zeros.push(bisect(m, prevX, x));
    }
    prevX = x;
    prevVal = val;
  }
  return zeros;
}

function bisect(m: number, a: number, b: number): number {
  let lo = a;
  let hi = b;
  let fLo = besselJ(m, lo);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fMid = besselJ(m, mid);
    if (Math.sign(fMid) === Math.sign(fLo)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}
