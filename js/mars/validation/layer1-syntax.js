/**
 * MARS Validation - Layer 1: Syntactic Validation
 * Checks structural syntax, balanced delimiters and illegal consecutive operators
 */
window.MARS = window.MARS || {};
window.MARS.Validation = window.MARS.Validation || {};

class Layer1SyntaxValidator {
    static validate(exprStr) {
        const issues = [];
        const clean = exprStr.replace(/\s+/g, '');

        if (!clean) {
            return { valid: false, issues: ['Expressão vazia'] };
        }

        // 1. Balanced parentheses and brackets
        let balanceParen = 0;
        let balanceBracket = 0;
        for (let i = 0; i < clean.length; i++) {
            const ch = clean[i];
            if (ch === '(') balanceParen++;
            else if (ch === ')') balanceParen--;
            else if (ch === '[') balanceBracket++;
            else if (ch === ']') balanceBracket--;

            if (balanceParen < 0) {
                issues.push('Parêntese de fechamento ")" sem abertura correspondente.');
                break;
            }
            if (balanceBracket < 0) {
                issues.push('Colchete de fechamento "]" sem abertura correspondente.');
                break;
            }
        }
        if (balanceParen > 0) issues.push('Parêntese "(" não fechado.');
        if (balanceBracket > 0) issues.push('Colchete "[" não fechado.');

        // 2. Illegal adjacent operators e.g. ++, **, //, *+, /+
        if (/([+*/^=]){2,}/.test(clean)) {
            issues.push('Operadores adjacentes inválidos detectados (ex: ++, **, //).');
        }

        // 3. Trailing illegal binary operator
        if (/[+*/^<>]/.test(clean[clean.length - 1])) {
            issues.push(`Operador binário '${clean[clean.length - 1]}' sem operando à direita.`);
        }

        return {
            layer: 1,
            name: 'Validação Sintática',
            valid: issues.length === 0,
            issues
        };
    }
}

window.MARS.Validation.Layer1SyntaxValidator = Layer1SyntaxValidator;
