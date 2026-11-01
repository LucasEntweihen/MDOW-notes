/**
 * MARS Core - Data Types and Schemas
 */
window.MARS = window.MARS || {};
window.MARS.Core = window.MARS.Core || {};

window.MARS.Core.Types = {
    SymbolCategory: {
        DIGIT: 'digit',
        VARIABLE: 'variable',
        OPERATOR: 'operator',
        DELIMITER: 'delimiter',
        FUNCTION: 'function',
        RELATION: 'relation',
        STRUCTURAL: 'structural'
    },

    RegionType: {
        EQUATION: 'equation',
        STATS_TABLE: 'stats_table',
        CHART: 'chart',
        TEXT: 'text',
        ANNOTATION: 'annotation'
    },

    ASTNodeType: {
        NUMBER: 'NumberLiteral',
        VARIABLE: 'VariableIdentifier',
        BINARY_OP: 'BinaryOperation',
        UNARY_OP: 'UnaryOperation',
        POWER: 'PowerExpression',
        FRACTION: 'FractionExpression',
        ROOT: 'RootExpression',
        FUNCTION_CALL: 'FunctionCall',
        EQUATION: 'Equation',
        INEQUALITY: 'Inequality',
        MATRIX: 'MatrixLiteral',
        SUMMATION: 'SummationExpression',
        INTEGRAL: 'IntegralExpression',
        TABLE: 'DataTable',
        CHART: 'DataChart'
    },

    ValidationStatus: {
        VALID: 'valid',
        WARNING: 'warning',
        INVALID: 'invalid',
        SKIPPED: 'skipped'
    }
};
