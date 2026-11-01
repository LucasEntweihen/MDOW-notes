/**
 * MARS Math - Algebra & Equation Solver
 * Solves linear, quadratic (with Δ and Bhaskara), polynomial and multi-variable equations
 */
window.MARS = window.MARS || {};
window.MARS.Math = window.MARS.Math || {};

class Algebra {
    /**
     * Solves quadratic equation ax² + bx + c = 0
     */
    static solveQuadratic(a, b, c, variable = 'x') {
        const delta = b * b - 4 * a * c;
        const detailLines = [];
        detailLines.push(`• Equação de 2º Grau em (${variable}): ${Number(a.toFixed(4))}${variable}² + (${Number(b.toFixed(4))})${variable} + (${Number(c.toFixed(4))}) = 0`);
        detailLines.push(`• Discriminante: Δ = b² - 4ac = (${Number(b.toFixed(4))})² - 4·(${Number(a.toFixed(4))})·(${Number(c.toFixed(4))}) = ${Number(delta.toFixed(4))}`);

        if (delta >= 0) {
            const sqrtDelta = Math.sqrt(delta);
            const r1 = Number(((-b + sqrtDelta) / (2 * a)).toFixed(4));
            const r2 = Number(((-b - sqrtDelta) / (2 * a)).toFixed(4));
            const solText = Math.abs(r1 - r2) < 1e-6 ? `${variable} = ${r1}` : `${variable}₁ = ${r1},  ${variable}₂ = ${r2}`;
            detailLines.push(`• Raízes Reais por Bhaskara: ${solText}`);
            return {
                primaryResult: solText,
                roots: [r1, r2],
                delta,
                isComplex: false,
                detailLines
            };
        } else {
            const re = Number((-b / (2 * a)).toFixed(4));
            const im = Number((Math.sqrt(-delta) / Math.abs(2 * a)).toFixed(4));
            const solText = `${variable} = ${re} ± ${im}i`;
            detailLines.push(`• Raízes Complexas em ℂ: ${solText}`);
            return {
                primaryResult: solText,
                roots: [`${re}+${im}i`, `${re}-${im}i`],
                delta,
                isComplex: true,
                detailLines
            };
        }
    }

    /**
     * Solves linear equation bx + c = 0
     */
    static solveLinear(b, c, variable = 'x') {
        const root = Number((-c / b).toFixed(4));
        const detailLines = [
            `• Equação de 1º Grau em (${variable}): ${Number(b.toFixed(4))}${variable} + (${Number(c.toFixed(4))}) = 0`,
            `• Solução Exata: ${variable} = ${root}`
        ];
        return {
            primaryResult: `${variable} = ${root}`,
            roots: [root],
            detailLines
        };
    }

    /**
     * Isolates and classifies polynomial coefficients using finite differences
     */
    static solveEquationString(lhsStr, rhsStr = '0', variable = 'x') {
        const zeroExpr = `(${lhsStr}) - (${rhsStr})`;
        const compiled = math.compile(zeroExpr);
        const evalAt = (val) => compiled.evaluate({ [variable]: val, pi: Math.PI, e: Math.E });

        // Finite differences around 0 to extract quadratic/linear coefficients:
        // f(x) = a*x^2 + b*x + c
        const f0 = evalAt(0);
        const f1 = evalAt(1);
        const fm1 = evalAt(-1);
        const f2 = evalAt(2);

        const c = f0;
        const a = (f1 + fm1 - 2 * f0) / 2;
        const b = (f1 - fm1) / 2;

        const quadPred2 = a * 4 + b * 2 + c;
        const isQuadraticOrLinear = Math.abs(f2 - quadPred2) < 1e-5;

        if (isQuadraticOrLinear && Math.abs(a) < 1e-7 && Math.abs(b) > 1e-7) {
            return Algebra.solveLinear(b, c, variable);
        } else if (isQuadraticOrLinear && Math.abs(a) >= 1e-7) {
            return Algebra.solveQuadratic(a, b, c, variable);
        } else {
            // General numerical root finder in [-50, 50]
            const roots = window.MARS.Math.Calculus.findRealRoots(compiled, -50, 50, 400);
            const solText = roots.length > 0 ? `${variable} = ${roots.join(', ')}` : `Sem raiz real em [-50, 50]`;
            return {
                primaryResult: solText,
                roots,
                detailLines: [
                    `• Equação Geral: ${lhsStr} = ${rhsStr}`,
                    `• Soluções Numéricas no intervalo [-50, 50]: ${solText}`
                ]
            };
        }
    }
}

window.MARS.Math.Algebra = Algebra;
