/**
 * MARS - Mathematical Analysis and Recognition System
 * Main Orchestrator uniting Vision, Math, Statistics and 5-Layer Validation
 */
window.MARS = window.MARS || {};

class MARSSystem {
    constructor() {
        this.vision = window.MARS.Vision.instance;
        this.math = window.MARS.Math.instance;
        this.statistics = window.MARS.Statistics.instance;
        this.validator = window.MARS.Validation.MARSValidator;
        this.parser = window.MARS.Parser;
        this.core = window.MARS.Core;
    }

    init() {
        this.vision.init();
        return this;
    }

    /**
     * Complete pipeline from visual stroke array to mathematical solution and verification
     */
    processStrokes(strokes, context = {}) {
        // 1. MARS Vision: segmentation, feature extraction, multi-hypothesis classification
        const visionResult = this.vision.processStrokes(strokes, context);
        if (visionResult.clusters.length === 0) {
            return {
                ir: null,
                vision: visionResult,
                solution: null,
                validation: null
            };
        }

        // 2. Spatial Syntax Parsing & AST
        const parsedSyntax = this.parser.SpatialSyntaxParser.parse(visionResult.clusters);
        const ast = this.parser.ASTBuilder.parse(parsedSyntax.evalExpr);

        // 3. Build Intermediate Representation (IR)
        const ir = new this.core.MathematicalIR(visionResult.region.type);
        ir.setExpression(parsedSyntax.displayExpr, parsedSyntax.evalExpr, parsedSyntax.variables);
        ir.setAST(ast);
        ir.classifiedClusters = visionResult.clusters;
        ir.metadata.confidence = visionResult.averageConfidence;
        ir.metadata.uncertaintyFlag = visionResult.clusters.some(c => c.recognized.uncertain);

        // 4. Engine Routing: MARS Statistics vs MARS Math
        let solution = null;
        if (visionResult.region.type === this.core.Types.RegionType.STATS_TABLE) {
            solution = this.statistics.analyzeDataset(parsedSyntax.evalExpr);
        } else {
            solution = this.math.solve(ir);
        }

        // 5. 5-Layer Validation & Independent Verification
        const validation = this.validator.validateAll(parsedSyntax.evalExpr, solution);

        return {
            ir,
            vision: visionResult,
            parsedSyntax,
            solution,
            validation
        };
    }

    /**
     * Direct mathematical expression solving (textual or formula box)
     */
    solveDirect(exprStr, options = {}) {
        const mode = options.mode || 'symbolic';
        if (mode === 'stats') {
            const statsRes = this.statistics.analyzeDataset(exprStr);
            const validation = this.validator.validateAll(exprStr, statsRes);
            return {
                primaryResult: statsRes.primaryResult,
                detailLines: statsRes.detailLines,
                validation
            };
        }

        const ir = new this.core.MathematicalIR('expression');
        const vars = (exprStr.match(/\b[a-zA-Z]\b/g) || []).filter(v => v !== 'e');
        ir.setExpression(exprStr, exprStr.replace(/(\d)([a-zA-Z(])/g, '$1*$2'), [...new Set(vars)]);

        const solution = this.math.solve(ir);
        const validation = this.validator.validateAll(exprStr, solution);

        return {
            ...solution,
            validation
        };
    }
}

window.MARS.system = new MARSSystem();
