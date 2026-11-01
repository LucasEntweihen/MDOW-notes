/**
 * UI - Floating Text / Math Input Box
 * In-place chalkboard text and direct formula evaluator
 */
window.MARS_UI = window.MARS_UI || {};

class FloatingBox {
    static init() {
        this.floatingBox = document.getElementById('floating-text-box');
        this.floatingTextarea = document.getElementById('floating-textarea');
        this.textFontFamily = document.getElementById('text-font-family');
        this.textFontSize = document.getElementById('text-font-size');
        this.textTargetPos = { x: 1800, y: 1300 };
        this.textHasFrame = false;
        this.floatingBoxMode = 'text';

        document.getElementById('btn-text-frame')?.addEventListener('click', (e) => {
            this.textHasFrame = !this.textHasFrame;
            e.currentTarget.classList.toggle('bg-amber-400', this.textHasFrame);
            e.currentTarget.classList.toggle('text-slate-950', this.textHasFrame);
        });

        document.getElementById('btn-confirm-text')?.addEventListener('click', () => this.confirm());
        document.getElementById('btn-cancel-text')?.addEventListener('click', () => this.close());
    }

    static open(x, y, mode = 'text') {
        if (!this.floatingBox) this.init();
        const board = window.MARS_BOARD.instance;
        this.textTargetPos = { x, y };
        this.floatingBoxMode = mode;
        this.floatingBox.style.left = `${x}px`;
        this.floatingBox.style.top = `${y}px`;
        this.floatingBox.style.display = 'block';
        this.floatingTextarea.value = '';
        this.floatingTextarea.style.color = board.currentColor;
        this.floatingTextarea.style.fontFamily = this.textFontFamily.value;
        this.floatingTextarea.placeholder = mode === 'math-box' ? 'Ex: x^2 - 5x + 6 = 0 ou 3 + 5/2' : 'Texto em giz...';
        setTimeout(() => this.floatingTextarea.focus(), 20);
    }

    static close() {
        if (this.floatingBox) this.floatingBox.style.display = 'none';
    }

    static confirm() {
        const board = window.MARS_BOARD.instance;
        const raw = this.floatingTextarea.value.trim();
        if (raw) {
            if (this.floatingBoxMode === 'math-box') {
                const solution = window.MARS.system.solveDirect(raw);
                const headerLine = raw.includes('=') ? `➔ ${solution.primaryResult}` : `${raw} = ${solution.primaryResult}`;
                window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, headerLine, this.textTargetPos.x, this.textTargetPos.y, {
                    color: board.currentColor,
                    size: parseInt(this.textFontSize.value, 10),
                    font: this.textFontFamily.value,
                    framed: true
                });
                if (solution.detailLines && solution.detailLines.length > 0) {
                    window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, solution.detailLines.join('\n'), this.textTargetPos.x, this.textTargetPos.y + 68, {
                        color: '#38BDF8',
                        size: 26,
                        font: this.textFontFamily.value
                    });
                }
            } else {
                window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, raw, this.textTargetPos.x, this.textTargetPos.y, {
                    color: board.currentColor,
                    size: parseInt(this.textFontSize.value, 10),
                    font: this.textFontFamily.value,
                    framed: this.textHasFrame
                });
            }
            board.saveState();
            window.MARS_UI.Toast.show('Texto adicionado à lousa', 'success');
        }
        this.close();
    }
}

window.MARS_UI.FloatingBox = FloatingBox;
