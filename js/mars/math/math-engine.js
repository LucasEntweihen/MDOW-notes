/**
 * MARS Math - MARSMath Engine
 * Interpretation, symbolic simplification, calculus, algebra and exact arithmetic
 */
window.MARS = window.MARS || {};
window.MARS.Math = window.MARS.Math || {};

class MARSMathEngine {
    /**
     * Solves mathematical expression or parsed IR
     */
    solve(parsedIR, options = {}) {
        const rawEval = (parsedIR.evalExpr || '').replace(/=+$/, '').trim();
        const rawDisp = (parsedIR.displayExpr || rawEval).replace(/=+$/, '').trim();
        const vars = parsedIR.variables || [];
        const detailLines = [];
        let primaryResult = '?';

        if (!rawEval) {
            return { primaryResult: '?', detailLines: [] };
        }

        // 1. Matrix Literal (e.g. [[1, 2], [3, 4]])
        if (rawEval.startsWith('[')) {
            try {
                const matVal = math.evaluate(rawEval);
                const matAnalysis = window.MARS.Math.LinearAlgebra.analyzeMatrix(matVal);
                return {
                    primaryResult: matAnalysis.formatted,
                    detailLines: matAnalysis.detailLines
                };
            } catch (_) {}
        }

        // 2. Equation with '=' and unknown variables (e.g. 2x+4=10 or x^2-5x+6=0)
        if (rawEval.includes('=') && vars.length > 0) {
            const parts = rawEval.split('=').filter(Boolean);
            const lhs = parts[0];
            const rhs = parts[1] || '0';
            const v = vars[0];
            const res = window.MARS.Math.Algebra.solveEquationString(lhs, rhs, v);
            return res;
        }

        // 3. Symbolic Expression with variables (e.g. 2x + 3x, x^2 - 4)
        if (vars.length > 0) {
            const v = vars[0];
            try {
                const simplified = math.simplify(rawEval).toString();
                const derived = window.MARS.Math.Calculus.symbolicDerivative(rawEval, v);
                detailLines.push(`• Expressão Algébrica (${vars.join(', ')}): ${rawDisp}`);
                detailLines.push(`• Forma Simplificada: ${simplified}`);
                if (derived) detailLines.push(`• Derivada Simbólica d/d${v}: ${derived}`);

                if (vars.length === 1) {
                    const compiled = math.compile(rawEval);
                    const roots = window.MARS.Math.Calculus.findRealRoots(compiled, -25, 25, 250);
                    if (roots.length > 0) {
                        detailLines.push(`• Zeros da Função (${v} p/ f(${v})=0): ${v} = ${roots.join(', ')}`);
                    }
                }

                // Domain constraints
                const constraints = window.MARS.Math.FunctionAnalysis.checkDomainConstraints(rawEval);
                if (constraints.length > 0) {
                    detailLines.push(`• Condições de Existência / Domínio: ${constraints.map(c => c.expr).join(' e ')}`);
                }

                return {
                    primaryResult: simplified,
                    detailLines
                };
            } catch (_) {}
        }

        // 4. Exact Numerical / Arithmetic Evaluation
        try {
            const evaluated = math.evaluate(rawEval);
            primaryResult = typeof evaluated === 'number'
                ? window.MARS.Math.Arithmetic.formatPrecision(evaluated, 6)
                : math.format(evaluated, { precision: 6 });

            detailLines.push(`• Cálculo Exato: ${rawDisp} = ${primaryResult}`);

            if (typeof evaluated === 'number' && !Number.isInteger(evaluated) && isFinite(evaluated)) {
                const fracStr = window.MARS.Math.Arithmetic.toExactFraction(evaluated);
                if (fracStr) {
                    detailLines.push(`• Fração Geratriz Exata: ${fracStr}`);
                }
            }

            return {
                primaryResult,
                detailLines
            };
        } catch (err) {
            return {
                primaryResult: 'Expressão Inválida',
                detailLines: [`• Erro de Avaliação: ${err.message}`]
            };
        }
    }
}

window.MARS.Math.MARSMathEngine = MARSMathEngine;
window.MARS.Math.instance = new MARSMathEngine();
