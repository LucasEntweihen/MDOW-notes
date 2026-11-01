/**
 * MARS Math - Arithmetic Module
 * Exact rational numbers, GCD/MDC, LCM/MMC, and scientific notation
 */
window.MARS = window.MARS || {};
window.MARS.Math = window.MARS.Math || {};

class Arithmetic {
    /**
     * Greatest Common Divisor (Euclidean algorithm)
     */
    static gcd(a, b) {
        a = Math.abs(Math.round(a));
        b = Math.abs(Math.round(b));
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    /**
     * Least Common Multiple
     */
    static lcm(a, b) {
        if (a === 0 || b === 0) return 0;
        return Math.abs(Math.round((a * b) / Arithmetic.gcd(a, b)));
    }

    /**
     * Converts a float into an exact rational fraction string (e.g. 0.75 -> 3/4)
     */
    static toExactFraction(val, maxDenominator = 10000) {
        if (!isFinite(val) || Math.abs(val) > 1e9) return null;
        if (Number.isInteger(val)) return `${val}`;

        const sign = val < 0 ? -1 : 1;
        val = Math.abs(val);

        let bestN = Math.round(val);
        let bestD = 1;
        let bestError = Math.abs(val - bestN);

        for (let d = 2; d <= maxDenominator; d++) {
            const n = Math.round(val * d);
            const err = Math.abs(val - n / d);
            if (err < bestError) {
                bestN = n;
                bestD = d;
                bestError = err;
                if (err < 1e-8) break;
            }
        }

        if (bestError < 1e-5 && bestD > 1) {
            const g = Arithmetic.gcd(bestN, bestD);
            const fn = (bestN / g) * sign;
            const fd = bestD / g;
            return `${fn}/${fd}`;
        }
        return null;
    }

    /**
     * Formats number with fixed precision or scientific notation when extreme
     */
    static formatPrecision(num, precision = 6) {
        if (typeof num !== 'number' || !isFinite(num)) return String(num);
        if (Math.abs(num) >= 1e7 || (Math.abs(num) > 0 && Math.abs(num) < 1e-4)) {
            return num.toExponential(4);
        }
        return Number(num.toFixed(precision)).toString();
    }
}

window.MARS.Math.Arithmetic = Arithmetic;
