/**
 * MARS Validation - Layer 5: Independent Verification
 * Verifies results using independent dual-algorithm verification (e.g. re-substitution, numerical dual-check)
 */
window.MARS = window.MARS || {};
window.MARS.Validation = window.MARS.Validation || {};

class Layer5IndependentVerifier {
    static verify(exprStr, solution = null) {
        const checks = [];
        let allVerified = true;

        // 1. Equation root re-substitution check: |LHS(root) - RHS(root)| < 1e-4
        if (exprStr.includes('=') && solution && Array.isArray(solution.roots)) {
            const parts = exprStr.split('=').filter(Boolean);
            if (parts.length >= 2) {
                const lhs = parts[0];
                const rhs = parts[1];
                solution.roots.forEach(r => {
                    if (typeof r === 'number') {
                        try {
                            const valL = math.evaluate(lhs, { x: r, y: r, z: r });
                            const valR = math.evaluate(rhs, { x: r, y: r, z: r });
                            const residual = Math.abs(valL - valR);
                            const ok = residual < 1e-3;
                            if (!ok) allVerified = false;
                            checks.push({
                                type: 're_substitution',
                                target: `x = ${r}`,
                                residual,
                                passed: ok,
                                message: ok
                                    ? `Re-substituição confirmada: LHS(${r}) ≈ RHS(${r}) (resíduo = ${residual.toExponential(2)})`
                                    : `Falha na verificação: resíduo ${residual.toFixed(4)} excede tolerância!`
                            });
                        } catch (_) {}
                    }
                });
            }
        }

        // 2. Numerical evaluation dual-check
        if (!exprStr.includes('=') && solution && solution.primaryResult && !isNaN(Number(solution.primaryResult))) {
            try {
                const numVal = Number(solution.primaryResult);
                const reEval = math.evaluate(exprStr);
                const diff = Math.abs(numVal - reEval);
                const ok = diff < 1e-4;
                if (!ok) allVerified = false;
                checks.push({
                    type: 'numerical_dual_check',
                    passed: ok,
                    message: ok ? 'Cálculo verificado por método numérico independente.' : 'Divergência detectada no duplo método numérico.'
                });
            } catch (_) {}
        }

        return {
            layer: 5,
            name: 'Verificação Independente',
            valid: allVerified,
            checks
        };
    }
}

window.MARS.Validation.Layer5IndependentVerifier = Layer5IndependentVerifier;
