/**
 * MARS Parser - Symbol Disambiguator
 * Resolves visual ambiguities deterministically based on spatial layout, syntax and domain rules
 */
window.MARS = window.MARS || {};
window.MARS.Parser = window.MARS.Parser || {};

class SymbolDisambiguator {
    /**
     * Disambiguate 'x' (multiplication operator '*' vs variable 'x')
     */
    static disambiguateX(currCluster, prevCluster, nextCluster, hasEquals) {
        if (!currCluster || currCluster.recognized.symbol !== 'x') {
            return currCluster ? currCluster.recognized.symbol : '';
        }

        const prevSym = prevCluster?.recognized?.symbol;
        const nextSym = nextCluster?.recognized?.symbol;

        // If 'x' is placed strictly between two digits and there is no equation/variable context, it is multiplication
        const isBetweenDigits = prevSym && /^[0-9]$/.test(prevSym) && nextSym && /^[0-9]$/.test(nextSym);
        if (isBetweenDigits && !hasEquals) {
            const hGapPrev = currCluster.bbox.minX - prevCluster.bbox.maxX;
            const hGapNext = nextCluster.bbox.minX - currCluster.bbox.maxX;
            if (hGapPrev > 8 && hGapNext > 8) {
                return '*';
            }
        }

        return 'x';
    }

    /**
     * Disambiguate '-' (unary negative vs binary subtraction vs fraction bar)
     */
    static disambiguateMinus(currCluster, prevCluster, allClusters) {
        if (!currCluster || currCluster.recognized.symbol !== '-') {
            return currCluster ? currCluster.recognized.symbol : '';
        }

        const prevSym = prevCluster?.recognized?.symbol;
        // Unary negative if at start of expression or after an operator/left parenthesis
        if (!prevSym || ['+', '-', '*', '/', '(', '=', '^'].includes(prevSym)) {
            return 'UNARY_MINUS';
        }

        // Check if it acts as a fraction bar with elements strictly above and below its horizontal span
        const b = currCluster.bbox;
        const hasAbove = allClusters.some(c => c !== currCluster && c.bbox.maxY <= b.minY + 6 && c.bbox.maxX >= b.minX && c.bbox.minX <= b.maxX);
        const hasBelow = allClusters.some(c => c !== currCluster && c.bbox.minY >= b.maxY - 6 && c.bbox.maxX >= b.minX && c.bbox.minX <= b.maxX);

        if (hasAbove && hasBelow && b.width > 24) {
            return 'FRACTION_BAR';
        }

        return '-';
    }
}

window.MARS.Parser.SymbolDisambiguator = SymbolDisambiguator;
