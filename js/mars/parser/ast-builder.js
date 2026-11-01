/**
 * MARS Parser - Abstract Syntax Tree (AST) Builder
 * Recursive descent parser constructing structured mathematical syntax trees
 */
window.MARS = window.MARS || {};
window.MARS.Parser = window.MARS.Parser || {};

class ASTBuilder {
    static parse(exprStr) {
        const clean = exprStr.replace(/\s+/g, '');
        if (!clean) return null;

        let pos = 0;

        function peek() {
            return pos < clean.length ? clean[pos] : null;
        }

        function consume() {
            return pos < clean.length ? clean[pos++] : null;
        }

        function isDigit(c) {
            return c !== null && /[0-9.]/.test(c);
        }

        function isAlpha(c) {
            return c !== null && /[a-zA-Z_π]/.test(c);
        }

        // Grammar:
        // Equation := Relational ( ('=' | '<' | '>' | '<=' | '>=') Relational )?
        // Additive := Multiplicative ( ('+' | '-') Multiplicative )*
        // Multiplicative := Power ( ('*' | '/') Power )*
        // Power := Unary ( '^' Power )?   // Right-associative
        // Unary := ('+' | '-') Unary | Primary
        // Primary := Number | Variable | Function | '(' Equation ')'

        function parseEquation() {
            let left = parseAdditive();
            const relOps = ['=', '<=', '>=', '<', '>'];
            for (const op of relOps) {
                if (clean.startsWith(op, pos)) {
                    pos += op.length;
                    const right = parseAdditive();
                    return {
                        type: op === '=' ? 'Equation' : 'Inequality',
                        operator: op,
                        left,
                        right
                    };
                }
            }
            return left;
        }

        function parseAdditive() {
            let node = parseMultiplicative();
            while (peek() === '+' || peek() === '-') {
                const op = consume();
                const right = parseMultiplicative();
                node = {
                    type: 'BinaryOperation',
                    operator: op,
                    left: node,
                    right
                };
            }
            return node;
        }

        function parseMultiplicative() {
            let node = parsePower();
            while (peek() === '*' || peek() === '/') {
                const op = consume();
                const right = parsePower();
                node = {
                    type: 'BinaryOperation',
                    operator: op,
                    left: node,
                    right
                };
            }
            return node;
        }

        function parsePower() {
            let node = parseUnary();
            if (peek() === '^') {
                consume();
                const right = parsePower(); // Right-associative
                return {
                    type: 'PowerExpression',
                    operator: '^',
                    base: node,
                    exponent: right
                };
            }
            return node;
        }

        function parseUnary() {
            if (peek() === '+' || peek() === '-') {
                const op = consume();
                const arg = parseUnary();
                return {
                    type: 'UnaryOperation',
                    operator: op,
                    argument: arg
                };
            }
            return parsePrimary();
        }

        function parsePrimary() {
            const ch = peek();
            if (ch === '(') {
                consume();
                const inside = parseEquation();
                if (peek() === ')') consume();
                return inside;
            }

            if (isDigit(ch)) {
                let numStr = '';
                while (isDigit(peek())) {
                    numStr += consume();
                }
                return {
                    type: 'NumberLiteral',
                    value: parseFloat(numStr),
                    raw: numStr
                };
            }

            if (isAlpha(ch)) {
                let idStr = '';
                while (isAlpha(peek())) {
                    idStr += consume();
                }
                // Function call e.g. sin(x), sqrt(x), det(M)
                if (peek() === '(') {
                    consume();
                    const args = [];
                    while (peek() !== ')' && pos < clean.length) {
                        args.push(parseEquation());
                        if (peek() === ',') consume();
                    }
                    if (peek() === ')') consume();
                    return {
                        type: 'FunctionCall',
                        name: idStr,
                        arguments: args
                    };
                }
                return {
                    type: 'VariableIdentifier',
                    name: idStr === 'π' ? 'pi' : idStr
                };
            }

            // Fallback for unexpected token
            consume();
            return { type: 'Unknown', char: ch };
        }

        try {
            return parseEquation();
        } catch (_) {
            return null;
        }
    }
}

window.MARS.Parser.ASTBuilder = ASTBuilder;
