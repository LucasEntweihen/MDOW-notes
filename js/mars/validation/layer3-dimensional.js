/**
 * MARS Validation - Layer 3: Dimensional Validation
 * Checks dimensional consistency and matrix shapes
 */
window.MARS = window.MARS || {};
window.MARS.Validation = window.MARS.Validation || {};

class Layer3DimensionalValidator {
    static validate(exprStr) {
        const issues = [];
        const clean = exprStr.replace(/\s+/g, '');

        // If matrix expression, verify internal row lengths
        if (clean.startsWith('[') && clean.endsWith(']')) {
            try {
                const evaluated = math.evaluate(clean);
                const size = math.size(evaluated);
                if (size && size.length === 2) {
                    // Valid 2D matrix
                }
            } catch (err) {
                issues.push(`Incompatibilidade dimensional em matriz: ${err.message}`);
            }
        }

        return {
            layer: 3,
            name: 'Validação Dimensional',
            valid: issues.length === 0,
            issues
        };
    }
}

window.MARS.Validation.Layer3DimensionalValidator = Layer3DimensionalValidator;
