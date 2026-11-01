/**
 * UI - MARS Math Lab Modal
 * Advanced symbolic math, matrices, calculus and live 5-layer validation report
 */
window.MARS_UI = window.MARS_UI || {};

class MathLabUI {
    static init() {
        this.modal = document.getElementById('calc-lab-modal');
        this.modeSelect = document.getElementById('calc-lab-mode');
        this.input = document.getElementById('calc-lab-input');
        this.boundA = document.getElementById('calc-bound-a');
        this.boundB = document.getElementById('calc-bound-b');
        this.alsoPlot = document.getElementById('calc-also-plot');
        this.preview = document.getElementById('calc-steps-preview');

        document.getElementById('btn-open-calc-lab')?.addEventListener('click', () => this.open());
        document.getElementById('btn-close-calc-lab')?.addEventListener('click', () => this.close());

        document.querySelectorAll('.calc-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeSelect.value = btn.dataset.type;
                this.input.value = btn.dataset.expr;
                if (btn.dataset.a) this.boundA.value = btn.dataset.a;
                if (btn.dataset.b) this.boundB.value = btn.dataset.b;
                this.updatePreview();
            });
        });

        [this.modeSelect, this.input, this.boundA, this.boundB].forEach(el => {
            el?.addEventListener('input', () => this.updatePreview());
        });

        document.getElementById('btn-write-calc-to-board')?.addEventListener('click', () => this.writeToBoard());
    }

    static open() {
        if (!this.modal) this.init();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.updatePreview();
    }

    static close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }
    }

    static updatePreview() {
        const expr = this.input.value.trim();
        if (!expr) {
            this.preview.textContent = 'Digite uma expressão...';
            return;
        }

        const mode = this.modeSelect.value;
        const a = parseFloat(this.boundA.value) || -1;
        const b = parseFloat(this.boundB.value) || 4;

        try {
            let resText = '';
            let validation = null;

            if (mode === 'matrix' || expr.startsWith('[')) {
                const matVal = math.evaluate(expr);
                const matAnalysis = window.MARS.Math.LinearAlgebra.analyzeMatrix(matVal);
                resText = `Matriz:\n` + matAnalysis.detailLines.join('\n');
                validation = window.MARS.Validation.MARSValidator.validateAll(expr, { primaryResult: matAnalysis.formatted });
            } else if (mode === 'integral') {
                const derived = window.MARS.Math.Calculus.symbolicDerivative(expr, 'x');
                const compiled = math.compile(expr);
                const integral = window.MARS.Math.Calculus.simpsonIntegral(compiled, a, b, 140);
                const roots = window.MARS.Math.Calculus.findRealRoots(compiled, a, b, 200);
                resText = `Integral e Derivadas:\n` +
                          `• Derivada d/dx: ${derived || '?'}\n` +
                          `• Integral ∫[${a}, ${b}] f(x)dx ≈ ${integral.toFixed(4)}\n` +
                          `• Raízes em [${a}, ${b}]: ${roots.length ? roots.join(', ') : 'Nenhuma'}`;
                validation = window.MARS.Validation.MARSValidator.validateAll(expr, { roots });
            } else {
                const res = window.MARS.system.solveDirect(expr);
                resText = `Resultado: ${res.primaryResult}\n` + (res.detailLines || []).join('\n');
                validation = res.validation;
            }

            // Render 5-Layer Validation summary in preview
            let valSummary = '\n\n--- 5 Camadas de Validação MARS ---';
            if (validation) {
                validation.layers.forEach(l => {
                    const icon = l.valid ? '✓' : '⚠';
                    const issues = l.issues && l.issues.length > 0 ? ` (${l.issues.join('; ')})` : '';
                    valSummary += `\n[${icon}] C${l.layer} ${l.name}: ${l.valid ? 'Aprovado' : 'Atenção'}${issues}`;
                });
            }

            this.preview.textContent = resText + valSummary;
        } catch (err) {
            this.preview.textContent = `Expressão com erro sintático: ${err.message}`;
        }
    }

    static writeToBoard() {
        const board = window.MARS_BOARD.instance;
        const expr = this.input.value.trim();
        const mode = this.modeSelect.value;
        const a = parseFloat(this.boundA.value) || -1;
        const b = parseFloat(this.boundB.value) || 4;
        const alsoPlot = this.alsoPlot.checked;
        const cx = board.scrollContainer.scrollLeft + window.innerWidth / 2;
        const cy = board.scrollContainer.scrollTop + window.innerHeight / 2;

        this.close();

        if (mode === 'plot') {
            window.MARS_BOARD.BoardPlotter.plotFunction(board.mainCtx, expr, cx, cy);
            board.saveState();
            window.MARS_UI.Toast.show('Gráfico plotado na lousa!', 'success');
            return;
        }

        let reportText = '';
        if (mode === 'matrix' || expr.startsWith('[')) {
            const matVal = math.evaluate(expr);
            const matAnalysis = window.MARS.Math.LinearAlgebra.analyzeMatrix(matVal);
            reportText = `Álgebra Linear:\n` + matAnalysis.detailLines.join('\n');
        } else if (mode === 'integral') {
            const derived = window.MARS.Math.Calculus.symbolicDerivative(expr, 'x');
            const compiled = math.compile(expr);
            const integral = window.MARS.Math.Calculus.simpsonIntegral(compiled, a, b, 140);
            reportText = `Cálculo: ${expr}\n` +
                         `• d/dx: ${derived || '?'}\n` +
                         `• ∫[${a}, ${b}] f(x)dx ≈ ${integral.toFixed(4)}`;
        } else {
            const res = window.MARS.system.solveDirect(expr);
            reportText = `Cálculo: ${expr}\n` + (res.detailLines || []).join('\n');
        }

        window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, reportText, cx - 360, cy - 120, {
            color: board.currentColor,
            size: 34,
            framed: true
        });

        if (alsoPlot && /\bx\b/i.test(expr)) {
            window.MARS_BOARD.BoardPlotter.plotFunction(board.mainCtx, expr, cx + 260, cy + 20);
        }

        board.saveState();
        window.MARS_UI.Toast.show('Cálculo registrado na lousa', 'success');
    }
}

window.MARS_UI.MathLabUI = MathLabUI;
