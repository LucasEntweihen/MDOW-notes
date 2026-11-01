/**
 * MARS Application Bootstrap
 * Initializes board engine, UI modules and MARS mathematical architecture
 */
window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize MARS Mathematical Core & Vision
    window.MARS.system.init();

    // 2. Initialize Dual-Canvas Engine
    window.MARS_BOARD.instance.init();

    // 3. Initialize UI Components
    window.MARS_UI.Toolbar.init();
    window.MARS_UI.FloatingBox.init();
    window.MARS_UI.CVInspector.init();
    window.MARS_UI.MathLabUI.init();
    window.MARS_UI.StatsLabUI.init();

    // 4. Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        const key = e.key.toLowerCase();
        if (key === 'p') {
            document.querySelector('.micro-btn[data-tool="pen"]')?.click();
        } else if (key === 'e') {
            document.querySelector('.micro-btn[data-tool="eraser"]')?.click();
        } else if (key === 't') {
            document.querySelector('.micro-btn[data-tool="text"]')?.click();
        } else if (key === 'm') {
            document.querySelector('.micro-btn[data-tool="math-box"]')?.click();
        } else if (key === 's') {
            document.querySelector('.micro-btn[data-tool="scanner"]')?.click();
        } else if (key === 'f') {
            window.MARS_UI.MathLabUI.open();
        } else if (key === 'd') {
            window.MARS_UI.StatsLabUI.open();
        } else if (key === 'escape') {
            window.MARS_UI.FloatingBox.close();
            window.MARS_UI.MathLabUI.close();
            window.MARS_UI.StatsLabUI.close();
        }
    });

    console.log('[MARS] Sistema MARS (Mathematical Analysis and Recognition System) inicializado com sucesso.');
});
