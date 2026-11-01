/**
 * UI - Toolbar Controller
 * Micro-dock tools, color selection and action bindings
 */
window.MARS_UI = window.MARS_UI || {};

class Toolbar {
    static init() {
        const board = window.MARS_BOARD.instance;

        // Tool buttons
        document.querySelectorAll('.micro-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.micro-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                board.currentTool = btn.dataset.tool;

                board.wrapper.className = '';
                if (board.currentTool === 'pan') board.wrapper.classList.add('cursor-pan');
                else if (board.currentTool === 'text' || board.currentTool === 'math-box') board.wrapper.classList.add('cursor-text');
                else if (board.currentTool === 'scanner') board.wrapper.classList.add('cursor-scan');
                else board.wrapper.classList.add('cursor-draw');
            });
        });

        // Color buttons
        document.querySelectorAll('.micro-color-dot').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.micro-color-dot').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                board.currentColor = btn.dataset.color;
                const floatingTextarea = document.getElementById('floating-textarea');
                if (floatingTextarea) floatingTextarea.style.color = board.currentColor;
            });
        });

        // Slider and checkboxes
        const sizeSlider = document.getElementById('chalk-size-slider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                board.chalkSize = parseInt(e.target.value, 10);
            });
        }

        const metricsCheckbox = document.getElementById('toggle-shape-metrics');
        if (metricsCheckbox) {
            metricsCheckbox.addEventListener('change', (e) => {
                board.showShapeMetrics = e.target.checked;
            });
        }

        // Actions
        document.getElementById('btn-undo')?.addEventListener('click', () => board.undo());
        document.getElementById('btn-redo')?.addEventListener('click', () => board.redo());
        document.getElementById('btn-center-board')?.addEventListener('click', () => board.centerView());
        document.getElementById('btn-clear-board')?.addEventListener('click', () => {
            board.clearBoard();
            window.MARS_UI.Toast.show('Lousa limpa', 'info');
        });

        // Scan all strokes
        document.getElementById('btn-solve-all-strokes')?.addEventListener('click', () => {
            if (board.vectorStrokes.length === 0) {
                window.MARS_UI.Toast.show('Desenhe uma expressão na lousa antes de escanear.', 'warning');
                document.getElementById('cv-inspector-panel')?.classList.remove('translate-x-[120%]');
                return;
            }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            board.vectorStrokes.forEach(st => {
                if (st.bbox.minX < minX) minX = st.bbox.minX;
                if (st.bbox.minY < minY) minY = st.bbox.minY;
                if (st.bbox.maxX > maxX) maxX = st.bbox.maxX;
                if (st.bbox.maxY > maxY) maxY = st.bbox.maxY;
            });
            window.MARS_UI.CVInspector.runScanner({ minX: minX - 10, minY: minY - 10, maxX: maxX + 10, maxY: maxY + 10 });
        });
    }
}

window.MARS_UI.Toolbar = Toolbar;
