/**
 * MARS Validation - Unified 5-Layer Validator
 * Orchestrates Syntax, Mathematical, Dimensional, Domain and Independent Verification
 */
window.MARS = window.MARS || {};
window.MARS.Validation = window.MARS.Validation || {};

class MARSValidator {
    static validateAll(exprStr, solution = null) {
        const layer1 = window.MARS.Validation.Layer1SyntaxValidator.validate(exprStr);
        const layer2 = window.MARS.Validation.Layer2MathematicalValidator.validate(exprStr);
        const layer3 = window.MARS.Validation.Layer3DimensionalValidator.validate(exprStr);
        const layer4 = window.MARS.Validation.Layer4DomainValidator.validate(exprStr, solution);
        const layer5 = window.MARS.Validation.Layer5IndependentVerifier.verify(exprStr, solution);

        const layers = [layer1, layer2, layer3, layer4, layer5];
        const allValid = layers.every(l => l.valid);

        return {
            allValid,
            score: layers.filter(l => l.valid).length / 5,
            layers
        };
    }
}

window.MARS.Validation.MARSValidator = MARSValidator;
