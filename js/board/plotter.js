/**
 * Board Engine - Mathematical & Statistical Plotter
 * Plots functions f(x), Boxplots, Histograms and Scatter/Regression charts in chalk
 */
window.MARS_BOARD = window.MARS_BOARD || {};

class BoardPlotter {
    /**
     * Plot mathematical function f(x) onto main canvas
     */
    static plotFunction(ctx, fnExpr, centerX, centerY, widthPx = 480, heightPx = 340) {
        const minX = centerX - widthPx / 2, maxX = centerX + widthPx / 2;
        const minY = centerY - heightPx / 2, maxY = centerY + heightPx / 2;

        window.MARS_BOARD.drawGeometricShape(ctx, 'axes', minX, minY, maxX, maxY, '#F8FAFC', 3.5, false, 0, 0);

        let compiled;
        try {
            compiled = math.compile(fnExpr.replace(/^f\(x\)\s*=\s*/i, '').replace(/^y\s*=\s*/i, ''));
        } catch (_) { return; }

        const scale = 50;
        let prevX = null, prevY = null;
        for (let sx = minX + 14; sx <= maxX - 14; sx += 3) {
            const mathX = (sx - centerX) / scale;
            try {
                const mathY = compiled.evaluate({ x: mathX });
                if (typeof mathY === 'number' && isFinite(mathY)) {
                    const sy = centerY - mathY * scale;
                    if (sy >= minY && sy <= maxY) {
                        if (prevX !== null) window.MARS_BOARD.drawFastChalkSegment(ctx, prevX, prevY, sx, sy, '#4ADE80', 4.5, 0, 0);
                        prevX = sx; prevY = sy;
                    } else prevX = null;
                } else prevX = null;
            } catch (_) { prevX = null; }
        }
        window.MARS_BOARD.drawChalkTextOnBoard(ctx, `f(x) = ${fnExpr}`, minX + 10, minY - 36, { color: '#FDE047', size: 32 });
    }

    /**
     * Plot statistical Boxplot (min, Q1, median, Q3, max)
     */
    static plotBoxplot(ctx, stats, centerX, centerY, widthPx = 440, heightPx = 180) {
        if (!stats) return;
        const left = centerX - widthPx / 2;
        const right = centerX + widthPx / 2;
        const midY = centerY;

        const valSpan = Math.max(1e-4, stats.max - stats.min);
        const toX = (v) => left + 40 + ((v - stats.min) / valSpan) * (widthPx - 80);

        const xMin = toX(stats.min);
        const xQ1 = toX(stats.q1);
        const xMed = toX(stats.median);
        const xQ3 = toX(stats.q3);
        const xMax = toX(stats.max);

        // Axis line
        window.MARS_BOARD.drawFastChalkSegment(ctx, left + 20, midY + 50, right - 20, midY + 50, '#94A3B8', 2.5);
        window.MARS_BOARD.drawChalkTextOnBoard(ctx, `${stats.min.toFixed(1)}`, xMin - 12, midY + 56, { color: '#94A3B8', size: 20 });
        window.MARS_BOARD.drawChalkTextOnBoard(ctx, `${stats.max.toFixed(1)}`, xMax - 12, midY + 56, { color: '#94A3B8', size: 20 });

        // Whiskers
        window.MARS_BOARD.drawFastChalkSegment(ctx, xMin, midY, xQ1, midY, '#38BDF8', 3);
        window.MARS_BOARD.drawFastChalkSegment(ctx, xQ3, midY, xMax, midY, '#38BDF8', 3);
        window.MARS_BOARD.drawFastChalkSegment(ctx, xMin, midY - 14, xMin, midY + 14, '#38BDF8', 3);
        window.MARS_BOARD.drawFastChalkSegment(ctx, xMax, midY - 14, xMax, midY + 14, '#38BDF8', 3);

        // Box [Q1, Q3]
        window.MARS_BOARD.drawGeometricShape(ctx, 'rect', xQ1, midY - 28, xQ3, midY + 28, '#FDE047', 3.5, false);

        // Median line
        window.MARS_BOARD.drawFastChalkSegment(ctx, xMed, midY - 28, xMed, midY + 28, '#FB7185', 4);

        // Label
        window.MARS_BOARD.drawChalkTextOnBoard(ctx, `Boxplot | Med = ${stats.median.toFixed(2)}`, left + 20, midY - 60, { color: '#FDE047', size: 26 });
    }

    /**
     * Plot statistical Histogram with frequency bars
     */
    static plotHistogram(ctx, freqTable, centerX, centerY, widthPx = 460, heightPx = 240) {
        if (!freqTable || !freqTable.classes || freqTable.classes.length === 0) return;
        const classes = freqTable.classes;
        const left = centerX - widthPx / 2;
        const bottom = centerY + heightPx / 2 - 30;
        const top = centerY - heightPx / 2 + 30;
        const plotW = widthPx - 60;
        const plotH = bottom - top;

        const maxFi = Math.max(...classes.map(c => c.fi), 1);
        const barW = plotW / classes.length;

        // Axes
        window.MARS_BOARD.drawFastChalkSegment(ctx, left + 40, bottom, left + 40 + plotW, bottom, '#F8FAFC', 3);
        window.MARS_BOARD.drawFastChalkSegment(ctx, left + 40, bottom, left + 40, top, '#F8FAFC', 3);

        classes.forEach((c, i) => {
            const bx = left + 40 + i * barW;
            const bh = (c.fi / maxFi) * (plotH - 20);
            const by = bottom - bh;

            window.MARS_BOARD.drawGeometricShape(ctx, 'rect', bx + 2, by, bx + barW - 2, bottom, '#38BDF8', 3, false);
            if (c.fi > 0) {
                window.MARS_BOARD.drawChalkTextOnBoard(ctx, `${c.fi}`, bx + barW / 2 - 6, by - 24, { color: '#FDE047', size: 20 });
            }
        });

        window.MARS_BOARD.drawChalkTextOnBoard(ctx, `Histograma (n = ${freqTable.n})`, left + 40, top - 32, { color: '#FDE047', size: 26 });
    }

    /**
     * Plot statistical Scatter plot with OLS regression line
     */
    static plotScatter(ctx, points, regResult, centerX, centerY, widthPx = 440, heightPx = 260) {
        if (!points || points.length === 0) return;
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));

        const left = centerX - widthPx / 2 + 40;
        const right = centerX + widthPx / 2 - 20;
        const bottom = centerY + heightPx / 2 - 30;
        const top = centerY - heightPx / 2 + 30;

        const spanX = Math.max(1e-4, maxX - minX);
        const spanY = Math.max(1e-4, maxY - minY);

        const toCanvasX = (x) => left + ((x - minX) / spanX) * (right - left);
        const toCanvasY = (y) => bottom - ((y - minY) / spanY) * (bottom - top);

        // Axes
        window.MARS_BOARD.drawFastChalkSegment(ctx, left, bottom, right, bottom, '#F8FAFC', 3);
        window.MARS_BOARD.drawFastChalkSegment(ctx, left, bottom, left, top, '#F8FAFC', 3);

        // Points
        points.forEach(p => {
            const cx = toCanvasX(p.x);
            const cy = toCanvasY(p.y);
            window.MARS_BOARD.drawGeometricShape(ctx, 'circle', cx, cy, cx + 4, cy + 4, '#FDE047', 2.5, false);
        });

        // Regression line
        if (regResult) {
            const x1 = minX, y1 = regResult.predict(x1);
            const x2 = maxX, y2 = regResult.predict(x2);
            window.MARS_BOARD.drawFastChalkSegment(ctx, toCanvasX(x1), toCanvasY(y1), toCanvasX(x2), toCanvasY(y2), '#FB7185', 3.5);
            window.MARS_BOARD.drawChalkTextOnBoard(ctx, `${regResult.equation} (r = ${regResult.r.toFixed(3)})`, left, top - 32, { color: '#FB7185', size: 24 });
        }
    }
}

window.MARS_BOARD.BoardPlotter = BoardPlotter;
