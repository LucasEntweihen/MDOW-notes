/**
 * Board Engine - Procedural Chalk Brush & Stamps
 * High-performance textured chalk rendering with zero SVG filters
 */
window.MARS_BOARD = window.MARS_BOARD || {};

const CHALK_COLORS = window.MARS_CONFIG?.CHALK_COLORS || ['#F8FAFC', '#FDE047', '#FB7185', '#38BDF8', '#4ADE80'];
const chalkStamps = {};

// Fast pseudo-random Look-Up Table (LUT)
const LUT_SIZE = window.MARS_CONFIG?.LUT_SIZE || 2048;
const RAND_LUT = new Float32Array(LUT_SIZE);
for (let i = 0; i < LUT_SIZE; i++) RAND_LUT[i] = Math.random();
let lutIdx = 0;
function fastRand() {
    lutIdx = (lutIdx + 1) & (LUT_SIZE - 1);
    return RAND_LUT[lutIdx];
}

function buildChalkBrushStamps() {
    CHALK_COLORS.forEach(color => {
        const stamp = document.createElement('canvas');
        stamp.width = 32;
        stamp.height = 32;
        const sCtx = stamp.getContext('2d');
        sCtx.fillStyle = color;

        const cx = 16, cy = 16, maxR = 14;
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const dist = Math.hypot(x - cx, y - cy);
                if (dist <= maxR) {
                    const falloff = 1 - (dist / maxR);
                    if (fastRand() < falloff * 0.78) {
                        sCtx.globalAlpha = (0.28 + fastRand() * 0.65) * falloff;
                        sCtx.fillRect(x, y, 1.4, 1.4);
                    }
                }
            }
        }
        chalkStamps[color] = stamp;
    });
}

function drawFastChalkSegment(ctx, x1, y1, x2, y2, color = '#F8FAFC', size = 5, offsetX = 0, offsetY = 0) {
    const stamp = chalkStamps[color] || chalkStamps['#F8FAFC'];
    const sx1 = x1 - offsetX, sy1 = y1 - offsetY;
    const sx2 = x2 - offsetX, sy2 = y2 - offsetY;

    const dx = sx2 - sx1;
    const dy = sy2 - sy1;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1.2, size * 0.28);
    const steps = Math.max(1, Math.ceil(dist / step));
    const drawDiameter = size * 2.1;
    const halfD = drawDiameter * 0.5;

    ctx.save();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const jx = (fastRand() - 0.5) * 1.1;
        const jy = (fastRand() - 0.5) * 1.1;
        const px = sx1 + dx * t + jx - halfD;
        const py = sy1 + dy * t + jy - halfD;
        ctx.drawImage(stamp, px, py, drawDiameter, drawDiameter);
    }
    ctx.restore();
}

function drawChalkPolyline(ctx, pts, color = '#F8FAFC', size = 5, offsetX = 0, offsetY = 0) {
    if (!pts || pts.length === 0) return;
    if (pts.length === 1) {
        drawFastChalkSegment(ctx, pts[0].x, pts[0].y, pts[0].x + 0.5, pts[0].y + 0.5, color, size, offsetX, offsetY);
        return;
    }
    for (let i = 0; i < pts.length - 1; i++) {
        drawFastChalkSegment(ctx, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, color, size, offsetX, offsetY);
    }
}

window.MARS_BOARD.buildChalkBrushStamps = buildChalkBrushStamps;
window.MARS_BOARD.drawFastChalkSegment = drawFastChalkSegment;
window.MARS_BOARD.drawChalkPolyline = drawChalkPolyline;
window.MARS_BOARD.fastRand = fastRand;
