/**
 * MARS Statistics - Probability Module
 * Combinatorics, classical probability, Bayes theorem and expected value
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class Probability {
    static factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    static combination(n, k) {
        if (k < 0 || k > n) return 0;
        return Math.round(Probability.factorial(n) / (Probability.factorial(k) * Probability.factorial(n - k)));
    }

    static permutation(n, k) {
        if (k < 0 || k > n) return 0;
        return Math.round(Probability.factorial(n) / Probability.factorial(n - k));
    }

    /**
     * Bayes Theorem: P(A|B) = [P(B|A) * P(A)] / P(B)
     */
    static bayes(pA, pBGivenA, pB) {
        if (pB <= 0) return null;
        return (pBGivenA * pA) / pB;
    }

    /**
     * Discrete Random Variable Expected Value and Variance
     */
    static discreteRandomVariable(values, probabilities) {
        if (values.length !== probabilities.length) return null;
        const probSum = probabilities.reduce((acc, p) => acc + p, 0);

        let ex = 0;
        let ex2 = 0;
        for (let i = 0; i < values.length; i++) {
            ex += values[i] * probabilities[i];
            ex2 += (values[i] ** 2) * probabilities[i];
        }
        const variance = ex2 - (ex ** 2);
        const stdDev = Math.sqrt(Math.max(0, variance));

        return {
            expectedValue: ex,
            variance,
            stdDev,
            probSumValid: Math.abs(probSum - 1.0) < 1e-4
        };
    }
}

window.MARS.Statistics.Probability = Probability;
