/**
 * MARS Statistics - Linear Regression & Correlation Module
 * Pearson r, R², Ordinary Least Squares (OLS) line y = mx + b
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class LinearRegression {
    /**
     * Compute Pearson correlation r and OLS line y = mx + b
     */
    static fit(points) {
        if (!points || points.length < 2) return null;
        const valid = points.filter(p => typeof p.x === 'number' && typeof p.y === 'number' && isFinite(p.x) && isFinite(p.y));
        const n = valid.length;
        if (n < 2) return null;

        let sumX = 0, sumY = 0;
        valid.forEach(p => { sumX += p.x; sumY += p.y; });
        const meanX = sumX / n;
        const meanY = sumY / n;

        let sxx = 0, syy = 0, sxy = 0;
        valid.forEach(p => {
            const dx = p.x - meanX;
            const dy = p.y - meanY;
            sxx += dx * dx;
            syy += dy * dy;
            sxy += dx * dy;
        });

        if (sxx === 0) return null; // Vertical points

        const slope = sxy / sxx;
        const intercept = meanY - slope * meanX;

        const r = syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
        const r2 = r * r;

        // Strength description
        let strength = 'Nula / Muito Fraca';
        const absR = Math.abs(r);
        if (absR >= 0.9) strength = 'Muito Forte';
        else if (absR >= 0.7) strength = 'Forte';
        else if (absR >= 0.5) strength = 'Moderada';
        else if (absR >= 0.3) strength = 'Fraca';

        const direction = r > 0 ? 'Positiva' : (r < 0 ? 'Negativa' : 'Nula');

        return {
            n,
            slope,
            intercept,
            equation: `y = ${Number(slope.toFixed(4))}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(Number(intercept.toFixed(4)))}`,
            r,
            r2,
            direction,
            strength,
            predict: (x) => slope * x + intercept,
            note: 'Atenção: Correlação não implica causalidade entre as variáveis.'
        };
    }
}

window.MARS.Statistics.LinearRegression = LinearRegression;
