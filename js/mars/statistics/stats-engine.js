/**
 * MARS Statistics - MARSStatistics Engine
 * Primary subsystem for descriptive, inferential, probabilistic and tabular data analysis
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class MARSStatisticsEngine {
    /**
     * Process list of numbers into full descriptive statistical report
     */
    analyzeDataset(rawInput) {
        let values = [];
        if (Array.isArray(rawInput)) {
            values = rawInput.map(Number).filter(isFinite);
        } else if (typeof rawInput === 'string') {
            const matches = rawInput.match(/-?\d+(?:\.\d+)?/g);
            if (matches) values = matches.map(Number);
        }

        if (values.length === 0) {
            return {
                primaryResult: 'Sem dados numéricos válidos',
                detailLines: []
            };
        }

        const d = window.MARS.Statistics.DescriptiveStats.analyzeVector(values);
        if (!d) {
            return {
                primaryResult: 'Erro na análise de dados',
                detailLines: []
            };
        }

        const ci = window.MARS.Statistics.InferentialStats.confidenceInterval(d.mean, d.sampleStdDev, d.n, 0.95);
        const modeStr = d.modes.length > 0 ? d.modes.join(', ') : 'Amodal';

        const detailLines = [
            `• Amostra (n = ${d.n}): Soma = ${d.sum.toFixed(3)}, Mín = ${d.min}, Máx = ${d.max}`,
            `• Tendência Central: Média (x̄) = ${d.mean.toFixed(4)} | Mediana = ${d.median.toFixed(4)} | Moda = ${modeStr}`,
            `• Dispersão Amostral: Variância (s²) = ${d.sampleVariance.toFixed(4)} | Desvio Padrão (s) = ${d.sampleStdDev.toFixed(4)}`,
            `• Coeficiente de Variação: CV = ${d.cv.toFixed(2)}% | Amplitude = ${d.range}`,
            `• Separatrizes: Q₁ = ${d.q1.toFixed(3)} | Q₃ = ${d.q3.toFixed(3)} | IQR = ${d.iqr.toFixed(3)}`,
            `• Intervalo de Confiança 95% para μ: [${ci.lower.toFixed(3)}, ${ci.upper.toFixed(3)}]`
        ];

        if (d.outliers.length > 0) {
            detailLines.push(`• Outliers Detectados (1.5×IQR): ${d.outliers.join(', ')}`);
        }

        return {
            primaryResult: `x̄ = ${d.mean.toFixed(4)} | s = ${d.sampleStdDev.toFixed(4)}`,
            detailLines,
            stats: d,
            ci
        };
    }

    /**
     * Fit linear regression for 2D points
     */
    analyzeBivariate(points) {
        const reg = window.MARS.Statistics.LinearRegression.fit(points);
        if (!reg) return null;

        const detailLines = [
            `• Reta OLS: ${reg.equation}`,
            `• Coeficiente de Correlação de Pearson: r = ${reg.r.toFixed(4)} (${reg.strength} ${reg.direction})`,
            `• Coeficiente de Determinação: R² = ${(reg.r2 * 100).toFixed(2)}%`,
            `• Inclinação (m) = ${reg.slope.toFixed(4)}, Intercepto (b) = ${reg.intercept.toFixed(4)}`,
            `• ${reg.note}`
        ];

        return {
            primaryResult: reg.equation,
            detailLines,
            regression: reg
        };
    }
}

window.MARS.Statistics.MARSStatisticsEngine = MARSStatisticsEngine;
window.MARS.Statistics.instance = new MARSStatisticsEngine();
