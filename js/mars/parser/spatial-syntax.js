/**
 * MARS Parser - Spatial Syntax Parser
 * Reconstructs 2D spatial arrangement into formal mathematical tokens and expressions
 */
window.MARS = window.MARS || {};
window.MARS.Parser = window.MARS.Parser || {};

class SpatialSyntaxParser {
    static parse(classifiedClusters) {
        if (!classifiedClusters || classifiedClusters.length === 0) {
            return {
                displayExpr: '',
                evalExpr: '',
                variables: [],
                tokens: []
            };
        }

        const syms = classifiedClusters.map(c => c.recognized.symbol);
        const hasEquals = syms.includes('=');
        const tokens = [];

        for (let i = 0; i < classifiedClusters.length; i++) {
            const curr = classifiedClusters[i];
            const prev = i > 0 ? classifiedClusters[i - 1] : null;
            const next = i < classifiedClusters.length - 1 ? classifiedClusters[i + 1] : null;

            // Disambiguation
            let sym = curr.recognized.symbol;
            if (sym === 'x') {
                sym = window.MARS.Parser.SymbolDisambiguator.disambiguateX(curr, prev, next, hasEquals);
            }

            // Detect superscripts (exponents x², 2³)
            const isSuperscript = prev &&
                (/^[0-9xyzabcn)]$/.test(prev.recognized.symbol)) &&
                (/^[0-9xyzabcn]$/.test(sym)) &&
                curr.bbox.height < prev.bbox.height * 0.72 &&
                (curr.bbox.minY + curr.bbox.height * 0.5) < (prev.bbox.minY + prev.bbox.height * 0.46);

            if (isSuperscript) {
                tokens.push({ symbol: '^', type: 'operator', synthetic: true, bbox: curr.bbox });
            }

            tokens.push({
                symbol: sym,
                type: /^[0-9]$/.test(sym) ? 'digit' : (/^(x|y|z|a|b|c|n|pi|e)$/.test(sym) ? 'variable' : 'operator'),
                cluster: curr,
                bbox: curr.bbox
            });
        }

        // Build display expression and explicit algebraic evaluation expression
        let displayExpr = '';
        let evalExpr = '';
        const varsSet = new Set();

        for (let i = 0; i < tokens.length; i++) {
            const tk = tokens[i];
            const prevTk = i > 0 ? tokens[i - 1] : null;

            if (tk.type === 'variable' && tk.symbol !== 'pi' && tk.symbol !== 'e') {
                varsSet.add(tk.symbol);
            }

            // Implicit multiplication rules:
            // 2x -> 2*x, x(y) -> x*(y), (x+1)2 -> (x+1)*2, 2(3) -> 2*(3)
            if (prevTk) {
                const needImplicitMult =
                    (prevTk.type === 'digit' && (tk.type === 'variable' || tk.symbol === '(')) ||
                    (prevTk.type === 'variable' && (tk.type === 'variable' || tk.symbol === '(')) ||
                    (prevTk.symbol === ')' && (tk.type === 'digit' || tk.type === 'variable' || tk.symbol === '('));

                if (needImplicitMult) {
                    evalExpr += '*';
                }
            }

            displayExpr += tk.symbol === 'pi' ? 'π' : tk.symbol;
            evalExpr += tk.symbol;
        }

        return {
            displayExpr,
            evalExpr,
            variables: Array.from(varsSet),
            tokens
        };
    }
}

window.MARS.Parser.SpatialSyntaxParser = SpatialSyntaxParser;
