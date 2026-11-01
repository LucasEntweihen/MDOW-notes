/**
 * Board Engine - Dual-Canvas Engine
 * Hardware-accelerated viewport-bounded dual canvas with RAF batching
 */
window.MARS_BOARD = window.MARS_BOARD || {};

class CanvasEngine {
    constructor() {
        this.scrollContainer = document.getElementById('scroll-container');
        this.wrapper = document.getElementById('canvas-wrapper');
        this.mainCanvas = document.getElementById('main-canvas');
        this.draftCanvas = document.getElementById('draft-canvas');
        this.mainCtx = this.mainCanvas.getContext('2d', { desynchronized: true });
        this.draftCtx = this.draftCanvas.getContext('2d', { desynchronized: true });

        this.vectorStrokes = [];
        this.activeStrokePoints = [];
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndo = window.MARS_CONFIG?.MAX_UNDO || 16;

        this.currentTool = 'pen';
        this.currentColor = window.MARS_CONFIG?.DEFAULT_COLOR || '#F8FAFC';
        this.chalkSize = window.MARS_CONFIG?.DEFAULT_CHALK_SIZE || 5;
        this.showShapeMetrics = true;

        this.isDrawing = false;
        this.isPanning = false;
        this.spaceBarHeld = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.panStartClientX = 0;
        this.panStartClientY = 0;
        this.panStartScrollLeft = 0;
        this.panStartScrollTop = 0;

        this.pendingRenderIdx = 0;
        this.rafPending = false;
    }

    init() {
        window.MARS_BOARD.buildChalkBrushStamps();
        this.resizeDraftCanvas();
        window.addEventListener('resize', () => this.resizeDraftCanvas());
        this.centerView();
        this.clearBoard(false);
        this.saveState();
        this.bindEvents();
        return this;
    }

    resizeDraftCanvas() {
        this.draftCanvas.width = window.innerWidth;
        this.draftCanvas.height = window.innerHeight;
    }

    centerView() {
        this.scrollContainer.scrollLeft = (this.mainCanvas.width - window.innerWidth) / 2;
        this.scrollContainer.scrollTop = (this.mainCanvas.height - window.innerHeight) / 2;
    }

    saveState() {
        const snap = document.createElement('canvas');
        snap.width = this.mainCanvas.width;
        snap.height = this.mainCanvas.height;
        snap.getContext('2d').drawImage(this.mainCanvas, 0, 0);

        if (this.undoStack.length >= this.maxUndo) this.undoStack.shift();
        this.undoStack.push({
            canvasSnap: snap,
            strokes: JSON.parse(JSON.stringify(this.vectorStrokes))
        });
        this.redoStack.length = 0;
    }

    restoreState(stateObj) {
        this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.mainCtx.drawImage(stateObj.canvasSnap, 0, 0);
        this.vectorStrokes = JSON.parse(JSON.stringify(stateObj.strokes));
        this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            this.restoreState(this.undoStack[this.undoStack.length - 1]);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const next = this.redoStack.pop();
            this.undoStack.push(next);
            this.restoreState(next);
        }
    }

    clearBoard(save = true) {
        this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
        this.vectorStrokes = [];
        if (save) this.saveState();
    }

    eraseArea(x, y, radius = 32) {
        this.mainCtx.save();
        this.mainCtx.globalCompositeOperation = 'destination-out';
        this.mainCtx.beginPath();
        this.mainCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.mainCtx.fill();
        this.mainCtx.restore();

        this.vectorStrokes = this.vectorStrokes.filter(st => {
            return !st.points.some(p => Math.hypot(p.x - x, p.y - y) < radius);
        });
    }

    computeStrokeBBox(points) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        });
        return { minX, minY, maxX, maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
    }

    getWorkspaceCoords(e) {
        let cx = e.clientX, cy = e.clientY;
        if (e.touches && e.touches.length > 0) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            cx = e.changedTouches[0].clientX;
            cy = e.changedTouches[0].clientY;
        }
        return {
            x: cx + this.scrollContainer.scrollLeft,
            y: cy + this.scrollContainer.scrollTop,
            clientX: cx,
            clientY: cy
        };
    }

    renderActiveDraftFrame() {
        this.rafPending = false;
        if (!this.isDrawing) return;

        const offX = this.scrollContainer.scrollLeft;
        const offY = this.scrollContainer.scrollTop;

        if (this.currentTool === 'pen') {
            const len = this.activeStrokePoints.length;
            if (len === 1 && this.pendingRenderIdx === 0) {
                const p = this.activeStrokePoints[0];
                window.MARS_BOARD.drawFastChalkSegment(this.draftCtx, p.x, p.y, p.x + 0.5, p.y + 0.5, this.currentColor, this.chalkSize, offX, offY);
                this.pendingRenderIdx = 1;
            } else {
                while (this.pendingRenderIdx < len) {
                    const p1 = this.activeStrokePoints[this.pendingRenderIdx - 1];
                    const p2 = this.activeStrokePoints[this.pendingRenderIdx];
                    window.MARS_BOARD.drawFastChalkSegment(this.draftCtx, p1.x, p1.y, p2.x, p2.y, this.currentColor, this.chalkSize, offX, offY);
                    this.pendingRenderIdx++;
                }
            }
        } else if (this.currentTool === 'scanner') {
            this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
            this.draftCtx.save();
            this.draftCtx.strokeStyle = '#FDE047';
            this.draftCtx.lineWidth = 2;
            this.draftCtx.setLineDash([6, 4]);
            this.draftCtx.strokeRect(this.startX - offX, this.startY - offY, this.currentX - this.startX, this.currentY - this.startY);
            this.draftCtx.restore();
        } else if (this.currentTool !== 'eraser') {
            this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
            window.MARS_BOARD.drawGeometricShape(this.draftCtx, this.currentTool, this.startX, this.startY, this.currentX, this.currentY, this.currentColor, this.chalkSize, this.showShapeMetrics, offX, offY);
        }
    }

    bindEvents() {
        const handleDown = (e) => {
            if (e.target.closest('header') || e.target.closest('aside') || e.target.closest('#floating-text-box') || e.target.closest('#calc-lab-modal') || e.target.closest('#stats-lab-modal')) return;

            const pos = this.getWorkspaceCoords(e);

            if (this.currentTool === 'pan' || this.spaceBarHeld || e.button === 1) {
                this.isPanning = true;
                this.panStartClientX = pos.clientX;
                this.panStartClientY = pos.clientY;
                this.panStartScrollLeft = this.scrollContainer.scrollLeft;
                this.panStartScrollTop = this.scrollContainer.scrollTop;
                return;
            }

            if (e.type === 'touchstart') e.preventDefault();

            if (this.currentTool === 'text' || this.currentTool === 'math-box') {
                window.MARS_UI?.FloatingBox?.open(pos.x, pos.y, this.currentTool);
                return;
            }

            this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
            this.isDrawing = true;
            this.startX = pos.x;
            this.startY = pos.y;
            this.currentX = pos.x;
            this.currentY = pos.y;

            if (this.currentTool === 'pen') {
                this.activeStrokePoints = [{ x: pos.x, y: pos.y }];
                this.pendingRenderIdx = 0;
                if (!this.rafPending) {
                    this.rafPending = true;
                    requestAnimationFrame(() => this.renderActiveDraftFrame());
                }
            } else if (this.currentTool === 'eraser') {
                this.eraseArea(pos.x, pos.y, this.chalkSize * 5.2);
            }
        };

        const handleMove = (e) => {
            const pos = this.getWorkspaceCoords(e);

            if (this.isPanning) {
                const dx = pos.clientX - this.panStartClientX;
                const dy = pos.clientY - this.panStartClientY;
                this.scrollContainer.scrollLeft = this.panStartScrollLeft - dx;
                this.scrollContainer.scrollTop = this.panStartScrollTop - dy;
                return;
            }

            if (!this.isDrawing) return;
            this.currentX = pos.x;
            this.currentY = pos.y;

            if (this.currentTool === 'pen') {
                const last = this.activeStrokePoints[this.activeStrokePoints.length - 1];
                if (Math.hypot(pos.x - last.x, pos.y - last.y) >= 2.2) {
                    this.activeStrokePoints.push({ x: pos.x, y: pos.y });
                    if (!this.rafPending) {
                        this.rafPending = true;
                        requestAnimationFrame(() => this.renderActiveDraftFrame());
                    }
                }
            } else if (this.currentTool === 'eraser') {
                this.eraseArea(pos.x, pos.y, this.chalkSize * 5.2);
            } else {
                if (!this.rafPending) {
                    this.rafPending = true;
                    requestAnimationFrame(() => this.renderActiveDraftFrame());
                }
            }
        };

        const handleUp = (e) => {
            if (this.isPanning) {
                this.isPanning = false;
                return;
            }
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.rafPending = false;

            if (this.currentTool === 'pen') {
                if (this.activeStrokePoints.length > 0) {
                    window.MARS_BOARD.drawChalkPolyline(this.mainCtx, this.activeStrokePoints, this.currentColor, this.chalkSize, 0, 0);
                    const bbox = this.computeStrokeBBox(this.activeStrokePoints);
                    this.vectorStrokes.push({
                        points: this.activeStrokePoints.slice(),
                        bbox,
                        color: this.currentColor,
                        size: this.chalkSize
                    });
                    this.saveState();
                }
                this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
                this.activeStrokePoints = [];
                this.pendingRenderIdx = 0;
            } else if (this.currentTool === 'scanner') {
                this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
                const minX = Math.min(this.startX, this.currentX);
                const minY = Math.min(this.startY, this.currentY);
                const maxX = Math.max(this.startX, this.currentX);
                const maxY = Math.max(this.startY, this.currentY);
                if (maxX - minX > 15 && maxY - minY > 15) {
                    window.MARS_UI?.CVInspector?.runScanner({ minX, minY, maxX, maxY });
                }
            } else if (this.currentTool === 'eraser') {
                this.saveState();
            } else {
                this.draftCtx.clearRect(0, 0, this.draftCanvas.width, this.draftCanvas.height);
                window.MARS_BOARD.drawGeometricShape(this.mainCtx, this.currentTool, this.startX, this.startY, this.currentX, this.currentY, this.currentColor, this.chalkSize, this.showShapeMetrics, 0, 0);
                this.saveState();
            }
        };

        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);

        window.addEventListener('touchstart', handleDown, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                this.spaceBarHeld = true;
                this.wrapper.classList.add('cursor-pan');
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.spaceBarHeld = false;
                if (this.currentTool !== 'pan') this.wrapper.classList.remove('cursor-pan');
            }
        });
    }
}

window.MARS_BOARD.CanvasEngine = CanvasEngine;
window.MARS_BOARD.instance = new CanvasEngine();
