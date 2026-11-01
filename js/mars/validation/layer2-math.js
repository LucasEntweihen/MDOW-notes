/**
 * MARS Validation - Layer 2: Mathematical Validation
 * Checks whether operations make mathematical sense
 */
window.MARS = window.MARS || {};
window.MARS.Validation = window.MARS.Validation || {};

class Layer2MathematicalValidator {
    static validate(exprStr) {
        const issues = [];
        const clean = exprStr.replace(/\s+/g, '');

        // 0^0 indeterminate
        if (/0\s*\^\s*0/.test(clean)) {
            issues.push('Indeterminação matemática 0^0 detectada.');
        }

        // Division by explicit zero /0
        if (/\/0(?![0-9.])/.test(clean)) {
            issues.push('Divisão direta por zero detectada (/0). Operação matematicamente indefinida.');
        }

        // Negative numbers inside square root in real domain
        if (/sqrt\s*\(\s*-\d/.test(clean)) {
            issues.push('Radicando negativo detectado em sqrt(): indefinido no conjunto dos Reais (ℝ), requer Complexos (ℂ).');
        }

        return {
            layer: 2,
            name: 'Validação Matemática',
            valid: issues.length === 0,
            issues
        };
    }
}

window.MARS.Validation.Layer2MathematicalValidator = Layer2MathematicalValidator;
