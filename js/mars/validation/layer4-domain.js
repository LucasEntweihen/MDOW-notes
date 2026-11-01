/**
 * MARS Validation - Layer 4: Domain Validation
 * Checks domain constraints, poles, singularities and restrictions
 */
window.MARS = window.MARS || {};
window.MARS.Validation = window.MARS.Validation || {};

class Layer4DomainValidator {
    static validate(exprStr, solution = null) {
        const issues = [];
        const domainRules = [];

        // Fraction denominators
        const denomMatches = exprStr.match(/\/\s*([a-zA-Z0-9_+*-]+)/g);
        if (denomMatches) {
            denomMatches.forEach(m => {
                const denom = m.replace(/^\/\s*/, '');
                domainRules.push(`Domínio: ${denom} ≠ 0`);
            });
        }

        // Logarithm domain
        const logMatches = exprStr.match(/(?:log|ln)\s*\(([^)]+)\)/g);
        if (logMatches) {
            logMatches.forEach(m => {
                const arg = m.replace(/^(?:log|ln)\s*\(/, '').replace(/\)$/, '');
                domainRules.push(`Domínio: ${arg} > 0`);
            });
        }

        // If candidate roots exist, verify none violates domain constraints
        if (solution && Array.isArray(solution.roots)) {
            solution.roots.forEach(r => {
                if (typeof r === 'number') {
                    // Check denominator evaluation at root
                    if (denomMatches) {
                        denomMatches.forEach(m => {
                            const denom = m.replace(/^\/\s*/, '');
                            try {
                                const val = math.evaluate(denom, { x: r, y: r });
                                if (Math.abs(val) < 1e-6) {
                                    issues.push(`Raiz x = ${r} viola restrição de domínio: anula o denominador (${denom} = 0)!`);
                                }
                            } catch (_) {}
                        });
                    }
                }
            });
        }

        return {
            layer: 4,
            name: 'Validação de Domínio',
            valid: issues.length === 0,
            domainRules,
            issues
        };
    }
}

window.MARS.Validation.Layer4DomainValidator = Layer4DomainValidator;
