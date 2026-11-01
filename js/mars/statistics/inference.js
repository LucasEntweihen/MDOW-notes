/**
 * MARS Statistics - Inferential Statistics Module
 * Confidence Intervals and One-Sample Hypothesis Testing (Z-Test, P-Value)
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class InferentialStats {
    /**
     * Confidence interval for population mean (90%, 95%, 99%)
     */
    static confidenceInterval(mean, stdDev, n, confidenceLevel = 0.95) {
        if (n <= 1 || stdDev < 0) return null;
        const se = stdDev / Math.sqrt(n);

        // Critical Z approximations
        let zCrit = 1.96; // default 95%
        if (Math.abs(confidenceLevel - 0.90) < 0.02) zCrit = 1.645;
        else if (Math.abs(confidenceLevel - 0.99) < 0.005) zCrit = 2.576;

        const marginOfError = zCrit * se;
        return {
            confidenceLevel,
            zCrit,
            standardError: se,
            marginOfError,
            lower: mean - marginOfError,
            upper: mean + marginOfError
        };
    }

    /**
     * One-Sample Hypothesis Test for Population Mean
     * H0: μ = mu0 vs H1: μ ≠ mu0
     */
    static oneSampleZTest(sampleMean, sampleStd, n, mu0, alpha = 0.05, alternative = 'two-sided') {
        if (n <= 1 || sampleStd <= 0) return null;
        const se = sampleStd / Math.sqrt(n);
        const zScore = (sampleMean - mu0) / se;

        let pValue = 0;
        const cdfZ = window.MARS.Statistics.Distributions.normalCDF(zScore, 0, 1);

        if (alternative === 'two-sided') {
            pValue = 2 * (1 - window.MARS.Statistics.Distributions.normalCDF(Math.abs(zScore), 0, 1));
        } else if (alternative === 'greater') {
            pValue = 1 - cdfZ;
        } else if (alternative === 'less') {
            pValue = cdfZ;
        }

        const rejectH0 = pValue < alpha;

        return {
            sampleMean,
            mu0,
            n,
            zScore,
            standardError: se,
            pValue,
            alpha,
            alternative,
            rejectH0,
            conclusion: rejectH0
                ? `Rejeita-se H₀ ao nível de significância α = ${alpha} (p-valor = ${pValue.toFixed(4)} < ${alpha}). Há evidência estatística de que a média difere de ${mu0}.`
                : `Não se rejeita H₀ ao nível de significância α = ${alpha} (p-valor = ${pValue.toFixed(4)} ≥ ${alpha}). Não há evidência suficiente contra H₀.`
        };
    }
}

window.MARS.Statistics.InferentialStats = InferentialStats;
