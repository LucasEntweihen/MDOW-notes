/**
 * MARS Statistics - Descriptive Statistics Module
 * Mean, weighted mean, median, mode, amplitude, variance, standard deviation,
 * coefficient of variation, quartiles, IQR, and grouped data
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class DescriptiveStats {
    /**
     * Complete descriptive analysis of numerical vector
     */
    static analyzeVector(values) {
        if (!values || values.length === 0) return null;
        const valid = values.filter(v => typeof v === 'number' && isFinite(v));
        if (valid.length === 0) return null;

        const n = valid.length;
        const sorted = [...valid].sort((a, b) => a - b);
        const sum = sorted.reduce((acc, v) => acc + v, 0);
        const mean = sum / n;

        // Min, Max, Range (Amplitude)
        const min = sorted[0];
        const max = sorted[n - 1];
        const range = max - min;

        // Median (Q2)
        const mid = Math.floor(n / 2);
        const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

        // Mode
        const freqMap = new Map();
        sorted.forEach(v => freqMap.set(v, (freqMap.get(v) || 0) + 1));
        let maxFreq = 0;
        freqMap.forEach(count => { if (count > maxFreq) maxFreq = count; });
        const modes = [];
        if (maxFreq > 1) {
            freqMap.forEach((count, val) => {
                if (count === maxFreq) modes.push(val);
            });
        }

        // Variances & Standard Deviations
        let ss = 0;
        sorted.forEach(v => { ss += (v - mean) ** 2; });
        const populationVariance = ss / n;
        const sampleVariance = n > 1 ? ss / (n - 1) : 0;
        const populationStdDev = Math.sqrt(populationVariance);
        const sampleStdDev = Math.sqrt(sampleVariance);

        // Coefficient of Variation (CV = s / mean * 100%)
        const cv = mean !== 0 ? (sampleStdDev / Math.abs(mean)) * 100 : 0;

        // Quartiles (Q1, Q3) and IQR
        const q1 = DescriptiveStats.percentile(sorted, 0.25);
        const q3 = DescriptiveStats.percentile(sorted, 0.75);
        const iqr = q3 - q1;

        // Outliers via 1.5 * IQR rule
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

        return {
            n,
            sum,
            mean,
            median,
            modes,
            min,
            max,
            range,
            sampleVariance,
            sampleStdDev,
            populationVariance,
            populationStdDev,
            cv,
            q1,
            q3,
            iqr,
            lowerFence,
            upperFence,
            outliers,
            sorted
        };
    }

    /**
     * Compute p-th percentile (0 <= p <= 1)
     */
    static percentile(sorted, p) {
        if (sorted.length === 0) return 0;
        if (sorted.length === 1) return sorted[0];
        const index = p * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    /**
     * Weighted arithmetic mean sum(x_i * w_i) / sum(w_i)
     */
    static weightedMean(values, weights) {
        if (!values || !weights || values.length !== weights.length || values.length === 0) return null;
        let sumProd = 0;
        let sumWeights = 0;
        for (let i = 0; i < values.length; i++) {
            sumProd += values[i] * weights[i];
            sumWeights += weights[i];
        }
        return sumWeights !== 0 ? sumProd / sumWeights : null;
    }
}

window.MARS.Statistics.DescriptiveStats = DescriptiveStats;
