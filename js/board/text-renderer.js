/**
 * Board Engine - Chalk Text Renderer
 * Direct multi-pass porous chalk text rendering without heavy SVG filters
 */
window.MARS_BOARD = window.MARS_BOARD || {};

function drawChalkTextOnBoard(ctx, text, x, y, opts = {}) {
    const color = opts.color || '#F8FAFC';
    const fontSize = opts.size || 46;
    const fontFamily = opts.font || "'Caveat', cursive";
    const align = opts.align || 'left';
    const framed = opts.framed || false;
    const offsetX = opts.offsetX || 0;
    const offsetY = opts.offsetY || 0;

    const tx = x - offsetX;
    const ty = y - offsetY;

    ctx.save();
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';

    const lines = String(text).split('\n');
    const lineHeight = fontSize * 1.18;
    let maxLineW = 0;

    lines.forEach((line, i) => {
        const ly = ty + i * lineHeight;
        const w = ctx.measureText(line).width;
        if (w > maxLineW) maxLineW = w;

        // Triple-pass textured chalk text + dotted chalk stroke
        ctx.globalAlpha = 0.88;
        ctx.fillText(line, tx, ly);

        ctx.globalAlpha = 0.35;
        ctx.fillText(line, tx + 1.1, ly + 0.6);

        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 2]);
        ctx.globalAlpha = 0.5;
        ctx.strokeText(line, tx - 0.5, ly - 0.4);
        ctx.setLineDash([]);
    });

    if (framed && maxLineW > 0) {
        const pad = 14;
        let boxX = x - pad;
        if (align === 'center') boxX = x - maxLineW / 2 - pad;
        if (align === 'right') boxX = x - maxLineW - pad;
        const boxY = y - pad * 0.4;
        const boxW = maxLineW + pad * 2;
        const boxH = lines.length * lineHeight + pad * 0.9;
        window.MARS_BOARD.drawGeometricShape(ctx, 'rect', boxX, boxY, boxX + boxW, boxY + boxH, color, 3.5, false, offsetX, offsetY);
    }
    ctx.restore();
}

window.MARS_BOARD.drawChalkTextOnBoard = drawChalkTextOnBoard;
