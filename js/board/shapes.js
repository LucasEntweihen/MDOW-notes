/**
 * Board Engine - Geometric & Mathematical Shapes
 * Straight lines, directional vectors, polygons, 3D cubes, Cartesian planes and trigonometric curves
 */
window.MARS_BOARD = window.MARS_BOARD || {};

function drawGeometricShape(ctx, tool, x1, y1, x2, y2, color = '#F8FAFC', size = 5, withMetrics = true, offX = 0, offY = 0) {
    const drawFastChalkSegment = window.MARS_BOARD.drawFastChalkSegment;
    const drawChalkTextOnBoard = window.MARS_BOARD.drawChalkTextOnBoard;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = Math.round((angleRad * 180) / Math.PI);

    if (tool === 'line') {
        drawFastChalkSegment(ctx, x1, y1, x2, y2, color, size, offX, offY);
        if (withMetrics && dist > 40) {
            drawChalkTextOnBoard(ctx, `L=${Math.round(dist)}px (${angleDeg}°)`, (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 28, { color, size: 26, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'vector') {
        drawFastChalkSegment(ctx, x1, y1, x2, y2, color, size, offX, offY);
        const head = Math.max(16, size * 3.2);
        drawFastChalkSegment(ctx, x2, y2, x2 - head * Math.cos(angleRad - Math.PI / 6), y2 - head * Math.sin(angleRad - Math.PI / 6), color, size, offX, offY);
        drawFastChalkSegment(ctx, x2, y2, x2 - head * Math.cos(angleRad + Math.PI / 6), y2 - head * Math.sin(angleRad + Math.PI / 6), color, size, offX, offY);
        if (withMetrics && dist > 45) {
            drawChalkTextOnBoard(ctx, `|v⃗|=${Math.round(dist)} (${angleDeg}°)`, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 28, { color, size: 26, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'rect') {
        drawFastChalkSegment(ctx, x1, y1, x2, y1, color, size, offX, offY);
        drawFastChalkSegment(ctx, x2, y1, x2, y2, color, size, offX, offY);
        drawFastChalkSegment(ctx, x2, y2, x1, y2, color, size, offX, offY);
        drawFastChalkSegment(ctx, x1, y2, x1, y1, color, size, offX, offY);
        const w = Math.round(Math.abs(dx)), h = Math.round(Math.abs(dy));
        if (withMetrics && w > 45 && h > 35) {
            drawChalkTextOnBoard(ctx, `${w}×${h} | A=${w * h}`, Math.min(x1, x2) + 6, Math.min(y1, y2) - 30, { color, size: 25, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'circle') {
        const r = Math.max(2, Math.round(dist));
        const steps = 48;
        for (let i = 0; i < steps; i++) {
            const a1 = (i / steps) * Math.PI * 2;
            const a2 = ((i + 1) / steps) * Math.PI * 2;
            drawFastChalkSegment(ctx, x1 + Math.cos(a1) * r, y1 + Math.sin(a1) * r, x1 + Math.cos(a2) * r, y1 + Math.sin(a2) * r, color, size, offX, offY);
        }
        if (withMetrics && r > 32) {
            drawFastChalkSegment(ctx, x1, y1, x2, y2, color, Math.max(2, size * 0.5), offX, offY);
            drawChalkTextOnBoard(ctx, `r=${r} | A≈${Math.round(Math.PI * r * r)}`, x1 + 6, y1 - 28, { color, size: 25, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'triangle') {
        const topX = (x1 + x2) / 2;
        drawFastChalkSegment(ctx, topX, y1, x2, y2, color, size, offX, offY);
        drawFastChalkSegment(ctx, x2, y2, x1, y2, color, size, offX, offY);
        drawFastChalkSegment(ctx, x1, y2, topX, y1, color, size, offX, offY);
        if (withMetrics && Math.abs(dx) > 45) {
            const b = Math.round(Math.abs(dx)), h = Math.round(Math.abs(dy));
            drawChalkTextOnBoard(ctx, `b=${b}, h=${h} | A=${Math.round((b * h) / 2)}`, Math.min(x1, x2), Math.max(y1, y2) + 6, { color, size: 25, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'right-triangle') {
        drawFastChalkSegment(ctx, x1, y1, x1, y2, color, size, offX, offY);
        drawFastChalkSegment(ctx, x1, y2, x2, y2, color, size, offX, offY);
        drawFastChalkSegment(ctx, x1, y1, x2, y2, color, size, offX, offY);
        const sq = 16, sx = dx >= 0 ? 1 : -1, sy = dy >= 0 ? -1 : 1;
        drawFastChalkSegment(ctx, x1 + sq * sx, y2, x1 + sq * sx, y2 + sq * sy, color, 2.5, offX, offY);
        drawFastChalkSegment(ctx, x1 + sq * sx, y2 + sq * sy, x1, y2 + sq * sy, color, 2.5, offX, offY);
        if (withMetrics && dist > 50) {
            const a = Math.round(Math.abs(dy)), b = Math.round(Math.abs(dx)), c = Math.round(Math.hypot(a, b));
            drawChalkTextOnBoard(ctx, `a=${a}, b=${b}, c=${c} (90°)`, Math.min(x1, x2), Math.max(y1, y2) + 6, { color, size: 25, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'polygon') {
        const sides = 6;
        for (let i = 0; i < sides; i++) {
            const a1 = angleRad + (i * 2 * Math.PI) / sides;
            const a2 = angleRad + ((i + 1) * 2 * Math.PI) / sides;
            drawFastChalkSegment(ctx, x1 + Math.cos(a1) * dist, y1 + Math.sin(a1) * dist, x1 + Math.cos(a2) * dist, y1 + Math.sin(a2) * dist, color, size, offX, offY);
        }
    }
    else if (tool === 'cube') {
        const ox = dx * 0.35, oy = -Math.abs(dy) * 0.35;
        // Front face
        drawGeometricShape(ctx, 'rect', x1, y1, x2, y2, color, size, false, offX, offY);
        // Rear face
        drawGeometricShape(ctx, 'rect', x1 + ox, y1 + oy, x2 + ox, y2 + oy, color, size * 0.85, false, offX, offY);
        // 3D Connecting edges
        drawFastChalkSegment(ctx, x1, y1, x1 + ox, y1 + oy, color, size * 0.85, offX, offY);
        drawFastChalkSegment(ctx, x2, y1, x2 + ox, y1 + oy, color, size * 0.85, offX, offY);
        drawFastChalkSegment(ctx, x2, y2, x2 + ox, y2 + oy, color, size * 0.85, offX, offY);
        drawFastChalkSegment(ctx, x1, y2, x1 + ox, y2 + oy, color, size * 0.85, offX, offY);
    }
    else if (tool === 'axes') {
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
        const step = 50;
        drawGeometricShape(ctx, 'vector', minX, midY, maxX, midY, color, size, false, offX, offY);
        drawGeometricShape(ctx, 'vector', midX, maxY, midX, minY, color, size, false, offX, offY);
        for (let gx = midX + step, u = 1; gx < maxX - 18; gx += step, u++) {
            drawFastChalkSegment(ctx, gx, midY - 5, gx, midY + 5, color, 2.5, offX, offY);
            drawChalkTextOnBoard(ctx, `${u}`, gx - 4, midY + 6, { color, size: 20, offsetX: offX, offsetY: offY });
        }
        for (let gx = midX - step, u = -1; gx > minX + 18; gx -= step, u--) {
            drawFastChalkSegment(ctx, gx, midY - 5, gx, midY + 5, color, 2.5, offX, offY);
            drawChalkTextOnBoard(ctx, `${u}`, gx - 8, midY + 6, { color, size: 20, offsetX: offX, offsetY: offY });
        }
        for (let gy = midY - step, u = 1; gy > minY + 18; gy -= step, u++) {
            drawFastChalkSegment(ctx, midX - 5, gy, midX + 5, gy, color, 2.5, offX, offY);
            drawChalkTextOnBoard(ctx, `${u}`, midX + 8, gy - 10, { color, size: 20, offsetX: offX, offsetY: offY });
        }
        for (let gy = midY + step, u = -1; gy < maxY - 18; gy += step, u--) {
            drawFastChalkSegment(ctx, midX - 5, gy, midX + 5, gy, color, 2.5, offX, offY);
            drawChalkTextOnBoard(ctx, `${u}`, midX + 8, gy - 10, { color, size: 20, offsetX: offX, offsetY: offY });
        }
    }
    else if (tool === 'sine') {
        const amp = dy / 2, midY = y1 + amp, steps = 56;
        for (let i = 0; i < steps; i++) {
            const t1 = i / steps, t2 = (i + 1) / steps;
            drawFastChalkSegment(ctx, x1 + dx * t1, midY + Math.sin(t1 * Math.PI * 4) * amp, x1 + dx * t2, midY + Math.sin(t2 * Math.PI * 4) * amp, color, size, offX, offY);
        }
    }
}

window.MARS_BOARD.drawGeometricShape = drawGeometricShape;
