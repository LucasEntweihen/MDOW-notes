/**
 * MARS Math - Functions Module
 * Domain checking, critical points and evaluation
 */
window.MARS = window.MARS || {};
window.MARS.Math = window.MARS.Math || {};

class FunctionAnalysis {
    /**
     * Inspect expression for common domain constraints (e.g. division by zero, log arguments, even roots)
     */
    static checkDomainConstraints(exprStr) {
        const constraints = [];

        // Check for fractions 1 / (expr)
        const denomMatches = exprStr.match(/\/\s*([a-zA-Z0-9_+*-]+)/g);
        if (denomMatches) {
            denomMatches.forEach(m => {
                const denom = m.replace(/^\/\s*/, '');
                constraints.push({ type: 'denominator_non_zero', expr: `${denom} ≠ 0` });
            });
        }

        // Check for logarithms log(expr) or ln(expr)
        const logMatches = exprStr.match(/(?:log|ln)\s*\(([^)]+)\)/g);
        if (logMatches) {
            logMatches.forEach(m => {
                const arg = m.replace(/^(?:log|ln)\s*\(/, '').replace(/\)$/, '');
                constraints.push({ type: 'log_argument_positive', expr: `${arg} > 0` });
            });
        }

        // Check for square roots sqrt(expr)
        const sqrtMatches = exprStr.match(/sqrt\s*\(([^)]+)\)/g);
        if (sqrtMatches) {
            sqrtMatches.forEach(m => {
                const arg = m.replace(/^sqrt\s*\(/, '').replace(/\)$/, '');
                constraints.push({ type: 'radicand_non_negative', expr: `${arg} ≥ 0 (em ℝ)` });
            });
        }

        return constraints;
    }
}

window.MARS.Math.FunctionAnalysis = FunctionAnalysis;
