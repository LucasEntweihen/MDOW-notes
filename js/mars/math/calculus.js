/**
 * MARS Math - Calculus Module
 * Derivatives, Limits, Simpson's Rule Numerical Integration and Root Isolation
 */
window.MARS = window.MARS || {};
window.MARS.Math = window.MARS.Math || {};

class Calculus {
    /**
     * Symbolic derivative with respect to a variable using math.js
     */
    static symbolicDerivative(exprStr, variable = 'x') {
        try {
            return math.derivative(exprStr, variable).toString();
        } catch (_) {
            return null;
        }
    }

    /**
     * Numerical derivative at point x0 via central differences
     */
    static numericalDerivative(compiledFn, x0, h = 1e-5) {
        const yPlus = compiledFn.evaluate({ x: x0 + h });
        const yMinus = compiledFn.evaluate({ x: x0 - h });
        return (yPlus - yMinus) / (2 * h);
    }

    /**
     * Simpson's 1/3 composite rule for definite numerical integration
     */
    static simpsonIntegral(compiledFn, a, b, n = 160) {
        if (n % 2 !== 0) n++;
        const h = (b - a) / n;
        let sum = compiledFn.evaluate({ x: a }) + compiledFn.evaluate({ x: b });
        for (let i = 1; i < n; i++) {
            const y = compiledFn.evaluate({ x: a + i * h });
            if (typeof y === 'number' && isFinite(y)) {
                sum += (i % 2 === 0 ? 2 : 4) * y;
            }
        }
        return (h / 3) * sum;
    }

    /**
     * Numerical limit of f(x) as x -> c from both sides
     */
    static numericalLimit(compiledFn, c, eps = 1e-6) {
        const left = compiledFn.evaluate({ x: c - eps });
        const right = compiledFn.evaluate({ x: c + eps });
        if (typeof left === 'number' && typeof right === 'number' && Math.abs(left - right) < 1e-4) {
            return (left + right) / 2;
        }
        return null;
    }

    /**
     * Find real roots in interval [a, b] using subdivision and bisection
     */
    static findRealRoots(compiledFn, a = -25, b = 25, subdivisions = 200) {
        const roots = [];
        const step = (b - a) / subdivisions;
        for (let i = 0; i < subdivisions; i++) {
            let x1 = a + i * step;
            let x2 = x1 + step;
            let y1 = compiledFn.evaluate({ x: x1 });
            let y2 = compiledFn.evaluate({ x: x2 });

            if (typeof y1 !== 'number' || typeof y2 !== 'number') continue;
            if (Math.abs(y1) < 1e-7) {
                roots.push(Number(x1.toFixed(4)));
            } else if (y1 * y2 < 0) {
                for (let iter = 0; iter < 24; iter++) {
                    const mid = (x1 + x2) / 2;
                    const yMid = compiledFn.evaluate({ x: mid });
                    if (y1 * yMid <= 0) {
                        x2 = mid;
                        y2 = yMid;
                    } else {
                        x1 = mid;
                        y1 = yMid;
                    }
                }
                roots.push(Number(((x1 + x2) / 2).toFixed(4)));
            }
        }
        return [...new Set(roots)];
    }
}

window.MARS.Math.Calculus = Calculus;
