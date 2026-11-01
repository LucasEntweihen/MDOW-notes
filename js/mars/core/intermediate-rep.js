/**
 * MARS Core - Intermediate Representation (IR)
 * Shared representation passed between MARS Vision, MARS Math and MARS Statistics
 */
window.MARS = window.MARS || {};
window.MARS.Core = window.MARS.Core || {};

class MathematicalIR {
    constructor(type = 'expression') {
        this.type = type; // 'expression', 'equation', 'matrix', 'dataset', 'frequency_table', 'chart'
        this.displayExpr = '';
        this.evalExpr = '';
        this.rawTokens = [];
        this.classifiedClusters = [];
        this.variables = [];
        this.ast = null;
        this.data = null; // Used for statistical lists / tables / coordinates
        this.metadata = {
            timestamp: Date.now(),
            bbox: null,
            confidence: 1.0,
            uncertaintyFlag: false,
            alternativeHypotheses: []
        };
    }

    setExpression(displayExpr, evalExpr, variables = []) {
        this.displayExpr = displayExpr;
        this.evalExpr = evalExpr;
        this.variables = variables;
        return this;
    }

    setData(data) {
        this.data = data;
        return this;
    }

    setAST(ast) {
        this.ast = ast;
        return this;
    }

    toJSON() {
        return {
            type: this.type,
            displayExpr: this.displayExpr,
            evalExpr: this.evalExpr,
            variables: this.variables,
            ast: this.ast,
            data: this.data,
            metadata: this.metadata
        };
    }
}

window.MARS.Core.MathematicalIR = MathematicalIR;
