/**
 * MARS Statistics - Distributions Module
 * Normal, Binomial, Poisson, Uniform and Exponential probability distributions
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class Distributions {
    /**
     * Standard error function erf(x) via Abramowitz and Stegun approximation
     */
    static erf(x) {
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    /**
     * Normal Distribution N(μ, σ)
     */
    static normalPDF(x, mu = 0, sigma = 1) {
        if (sigma <= 0) return 0;
        const z = (x - mu) / sigma;
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    }

    static normalCDF(x, mu = 0, sigma = 1) {
        if (sigma <= 0) return 0;
        return 0.5 * (1 + Distributions.erf((x - mu) / (sigma * Math.sqrt(2))));
    }

    /**
     * Binomial Distribution B(n, p)
     */
    static binomialPMF(k, n, p) {
        if (k < 0 || k > n || p < 0 || p > 1) return 0;
        const comb = window.MARS.Statistics.Probability.combination(n, k);
        return comb * (p ** k) * ((1 - p) ** (n - k));
    }

    static binomialCDF(k, n, p) {
        let sum = 0;
        for (let i = 0; i <= k; i++) {
            sum += Distributions.binomialPMF(i, n, p);
        }
        return Math.min(1.0, sum);
    }

    /**
     * Poisson Distribution Poisson(λ)
     */
    static poissonPMF(k, lambda) {
        if (k < 0 || lambda <= 0) return 0;
        const fact = window.MARS.Statistics.Probability.factorial(k);
        return ((lambda ** k) * Math.exp(-lambda)) / fact;
    }

    static poissonCDF(k, lambda) {
        let sum = 0;
        for (let i = 0; i <= k; i++) {
            sum += Distributions.poissonPMF(i, lambda);
        }
        return Math.min(1.0, sum);
    }

    /**
     * Uniform Distribution U(a, b)
     */
    static uniformPDF(x, a, b) {
        if (x < a || x > b || b <= a) return 0;
        return 1 / (b - a);
    }

    static uniformCDF(x, a, b) {
        if (x < a) return 0;
        if (x > b) return 1;
        return (x - a) / (b - a);
    }

    /**
     * Exponential Distribution Exp(λ)
     */
    static exponentialPDF(x, lambda) {
        if (x < 0 || lambda <= 0) return 0;
        return lambda * Math.exp(-lambda * x);
    }

    static exponentialCDF(x, lambda) {
        if (x < 0 || lambda <= 0) return 0;
        return 1 - Math.exp(-lambda * x);
    }
}

window.MARS.Statistics.Distributions = Distributions;
