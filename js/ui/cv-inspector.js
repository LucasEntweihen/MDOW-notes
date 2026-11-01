/**
 * UI - CV Inspector Drawer
 * Real-time inspection of 16x16 grid, topological features and multi-hypothesis candidates
 */
window.MARS_UI = window.MARS_UI || {};

class CVInspector {
    static init() {
        this.panel = document.getElementById('cv-inspector-panel');
        this.container = document.getElementById('cv-symbols-container');
        this.input = document.getElementById('cv-recognized-input');
        this.badge = document.getElementById('cv-confidence-badge');

        document.getElementById('btn-toggle-inspector')?.addEventListener('click', () => {
            this.panel.classList.toggle('translate-x-[120%]');
        });

        document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
            this.panel.classList.add('translate-x-[120%]');
        });

        document.getElementById('btn-recalculate-cv')?.addEventListener('click', () => {
            const val = this.input.value.trim();
            if (!val) return;
            const board = window.MARS_BOARD.instance;
            const cx = board.scrollContainer.scrollLeft + window.innerWidth * 0.38;
            const cy = board.scrollContainer.scrollTop + window.innerHeight * 0.42;
            const res = window.MARS.system.solveDirect(val);

            const hasTrailingEquals = val.endsWith('=');
            const isEquation = val.includes('=') && !hasTrailingEquals;
            const header = (hasTrailingEquals || isEquation) ? `➔ ${res.primaryResult}` : `${val} = ${res.primaryResult}`;

            window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, header, cx, cy, { color: '#FDE047', size: 52, framed: true });
            if (res.detailLines && res.detailLines.length > 0) {
                window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, res.detailLines.join('\n'), cx, cy + 76, { color: '#38BDF8', size: 28 });
            }
            board.saveState();
            window.MARS_UI.Toast.show('Recalculado e escrito na lousa!', 'success');
        });
    }

    static runScanner(regionBBox) {
        const board = window.MARS_BOARD.instance;
        const matchingStrokes = board.vectorStrokes.filter(st => {
            const b = st.bbox;
            return b.maxX >= regionBBox.minX && b.minX <= regionBBox.maxX && b.maxY >= regionBBox.minY && b.minY <= regionBBox.maxY;
        });

        if (matchingStrokes.length === 0) {
            window.MARS_UI.Toast.show('Nenhum traço de giz encontrado dentro da área.', 'warning');
            this.panel?.classList.remove('translate-x-[120%]');
            return;
        }

        // Run unified MARS Pipeline
        const result = window.MARS.system.processStrokes(matchingStrokes);
        const { ir, vision, solution, validation, parsedSyntax } = result;

        if (!vision || vision.clusters.length === 0) {
            window.MARS_UI.Toast.show('Não foi possível identificar símbolos matemáticos.', 'warning');
            return;
        }

        const offX = board.scrollContainer.scrollLeft;
        const offY = board.scrollContainer.scrollTop;
        board.draftCtx.clearRect(0, 0, board.draftCanvas.width, board.draftCanvas.height);

        // Render visual bounding boxes & confidence badges on draft canvas
        vision.clusters.forEach(c => {
            const b = c.bbox;
            const rec = c.recognized;
            board.draftCtx.save();
            board.draftCtx.strokeStyle = rec.category === 'variable' ? '#4ADE80' : '#38BDF8';
            board.draftCtx.lineWidth = 1.5;
            board.draftCtx.setLineDash([4, 3]);
            board.draftCtx.strokeRect(b.minX - offX - 4, b.minY - offY - 4, b.width + 8, b.height + 8);
            board.draftCtx.setLineDash([]);

            board.draftCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            board.draftCtx.fillRect(b.minX - offX - 4, b.minY - offY - 18, 52, 14);
            board.draftCtx.fillStyle = rec.category === 'variable' ? '#4ADE80' : '#FDE047';
            board.draftCtx.font = 'bold 10px monospace';
            board.draftCtx.fillText(`${rec.symbol} ${Math.round(rec.confidence * 100)}%`, b.minX - offX - 2, b.minY - offY - 8);
            board.draftCtx.restore();
        });

        this.populateUI(vision.clusters, parsedSyntax.evalExpr, vision.averageConfidence);

        // Write solution onto the board next to the expression
        const lastCluster = vision.clusters[vision.clusters.length - 1];
        const writeX = lastCluster.bbox.maxX + 32;
        const writeY = vision.clusters[0].bbox.minY;

        if (solution && solution.primaryResult) {
            const raw = parsedSyntax.evalExpr;
            const hasTrailingEquals = raw.endsWith('=');
            const isEquation = raw.includes('=') && !hasTrailingEquals;
            const header = (hasTrailingEquals || isEquation) ? `➔ ${solution.primaryResult}` : `= ${solution.primaryResult}`;

            window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, header, writeX, writeY, { color: '#FDE047', size: 52, framed: true });
            if (solution.detailLines && solution.detailLines.length > 0) {
                window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, solution.detailLines.join('\n'), writeX, writeY + 76, { color: '#38BDF8', size: 28 });
            }
            board.saveState();
            window.MARS_UI.Toast.show(`MARS Reconheceu: ${parsedSyntax.displayExpr}`, 'success');
        }

        setTimeout(() => {
            if (!board.isDrawing) board.draftCtx.clearRect(0, 0, board.draftCanvas.width, board.draftCanvas.height);
        }, 4200);
    }

    static populateUI(classifiedClusters, fullExpression, avgConfidence = 0.9) {
        if (!this.panel) this.init();
        this.panel.classList.remove('translate-x-[120%]');
        this.input.value = fullExpression;
        this.badge.textContent = `${Math.round(avgConfidence * 100)}%`;

        this.container.innerHTML = '';
        const GRID_N = window.MARS_CONFIG?.GRID_N || 16;

        classifiedClusters.forEach((item, clusterIdx) => {
            const rec = item.recognized;
            const feat = rec.features;
            const card = document.createElement('div');
            card.className = 'p-1.5 rounded bg-slate-900/90 border border-slate-700/80 flex gap-2 items-center';

            // 16x16 Matrix canvas
            const matrixCanvas = document.createElement('canvas');
            matrixCanvas.width = 32;
            matrixCanvas.height = 32;
            matrixCanvas.className = 'rounded border border-slate-600 bg-slate-950 shrink-0';
            const mCtx = matrixCanvas.getContext('2d');
            for (let gy = 0; gy < GRID_N; gy++) {
                for (let gx = 0; gx < GRID_N; gx++) {
                    const val = feat.grid[gy * GRID_N + gx];
                    mCtx.fillStyle = val > 0 ? '#FDE047' : (feat.distField[gy * GRID_N + gx] <= 1.2 ? 'rgba(56,189,248,0.28)' : '#090d11');
                    mCtx.fillRect(gx * 2, gy * 2, 1.8, 1.8);
                }
            }

            const catBadge = rec.category === 'variable' ? 'VAR' : (rec.category === 'digit' ? 'NUM' : 'OP');

            // Interactive candidate switcher
            const altsContainer = document.createElement('div');
            altsContainer.className = 'flex flex-wrap gap-1 mt-1';
            rec.topCandidates.forEach(cand => {
                const btn = document.createElement('button');
                btn.className = `px-1 py-0.5 rounded text-[8px] border transition-colors ${cand.symbol === rec.symbol ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-300'}`;
                btn.textContent = `${cand.symbol} ${Math.round(cand.score * 100)}%`;
                btn.title = `Trocar símbolo para "${cand.symbol}"`;
                btn.addEventListener('click', () => {
                    item.recognized.symbol = cand.symbol;
                    // Re-synthesize syntax
                    const parsed = window.MARS.Parser.SpatialSyntaxParser.parse(classifiedClusters);
                    CVInspector.populateUI(classifiedClusters, parsed.evalExpr, avgConfidence);
                });
                altsContainer.appendChild(btn);
            });

            const info = document.createElement('div');
            info.className = 'flex-1 leading-tight';
            info.innerHTML = `
                <div class="flex justify-between font-bold text-amber-300">
                    <span>#${item.index} "${rec.symbol}" <span class="text-[8px] px-1 rounded bg-slate-800 text-sky-300">${catBadge}</span></span>
                    <span class="text-emerald-400">${Math.round(rec.confidence * 100)}%</span>
                </div>
                <div class="text-[8px] text-slate-400">Tr:${feat.strokeCount} Bur:${feat.holeCount} X:${feat.crossings}</div>
            `;
            info.appendChild(altsContainer);

            card.appendChild(matrixCanvas);
            card.appendChild(info);
            this.container.appendChild(card);
        });
    }
}

window.MARS_UI.CVInspector = CVInspector;
