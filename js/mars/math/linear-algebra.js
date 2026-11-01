/**
 * MARS Math - Linear Algebra Module
 * Matrices, Determinants, Inverses, Trace, Transpose and Eigenvalues
 */
window.MARS = window.MARS || {};
window.MARS.Math = window.MARS.Math || {};

class LinearAlgebra {
    static analyzeMatrix(matVal) {
        const detailLines = [];
        const formatted = math.format(matVal, { precision: 4 });
        detailLines.push(`• Matriz M: ${formatted}`);

        const size = math.size(matVal);
        const rows = size[0] || size._data[0];
        const cols = size[1] || size._data[1];
        detailLines.push(`• Dimensão: ${rows} × ${cols}`);

        if (rows === cols) {
            try {
                const det = math.det(matVal);
                const roundDet = Number(math.round(det, 4));
                detailLines.push(`• Determinante: det(M) = ${roundDet}`);

                if (Math.abs(roundDet) > 1e-9) {
                    const inv = math.inv(matVal);
                    detailLines.push(`• Matriz Inversa M⁻¹: ${math.format(inv, { precision: 3 })}`);
                } else {
                    detailLines.push(`• Matriz Singular (det=0): Não possui inversa.`);
                }

                // Trace
                let tr = 0;
                for (let i = 0; i < rows; i++) {
                    tr += math.subset(matVal, math.index(i, i));
                }
                detailLines.push(`• Traço: tr(M) = ${Number(math.round(tr, 4))}`);

                // 2x2 Eigenvalues: λ² - tr*λ + det = 0
                if (rows === 2) {
                    const delta = tr * tr - 4 * det;
                    if (delta >= 0) {
                        const l1 = Number(((tr + Math.sqrt(delta)) / 2).toFixed(4));
                        const l2 = Number(((tr - Math.sqrt(delta)) / 2).toFixed(4));
                        detailLines.push(`• Autovalores (λ): λ₁ = ${l1}, λ₂ = ${l2}`);
                    } else {
                        const re = Number((tr / 2).toFixed(3));
                        const im = Number((Math.sqrt(-delta) / 2).toFixed(3));
                        detailLines.push(`• Autovalores Complexos (λ): ${re} ± ${im}i`);
                    }
                }
            } catch (err) {
                detailLines.push(`• Erro na análise matricial: ${err.message}`);
            }
        }

        try {
            const trans = math.transpose(matVal);
            detailLines.push(`• Transposta Mᵀ: ${math.format(trans, { precision: 4 })}`);
        } catch (_) {}

        return {
            formatted,
            detailLines
        };
    }
}

window.MARS.Math.LinearAlgebra = LinearAlgebra;
