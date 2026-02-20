import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

interface CursorPosition {
    line: number;
    column: number;
}

interface NodeLocation {
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
}

function isCursorHere(
    nodeLocation: NodeLocation,
    cursorLocation: CursorPosition,
) {
    const isThatLine =
        nodeLocation.start.line <= cursorLocation.line &&
        nodeLocation.end.line >= cursorLocation.line;

    const isThatColumn =
        nodeLocation.start.column <= cursorLocation.column &&
        nodeLocation.end.column >= cursorLocation.column;

    return isThatLine && isThatColumn;
}

export function getCursor(
    code: string,
    currentPosition: CursorPosition,
): CursorPosition | null {
    const ast = babelParser.parse(code);
    let wasCursorFound: any;

    traverse(ast, {
        enter(path) {
            if (path.node.loc && isCursorHere(path.node.loc, currentPosition)) {
                wasCursorFound = path;
            }
        },
    });

    if (wasCursorFound) {
        let loc: { line: number; column: number } | undefined;

        if (t.isArrowFunctionExpression(wasCursorFound.node)) {
            const arrowExpression = wasCursorFound.findParent((parentPath) =>
                t.isExpressionStatement(parentPath.node),
            );
            loc = arrowExpression.node.loc.end;
        } else {
            const externalNode = wasCursorFound.findParent(
                (parentPath) =>
                    t.isBlockStatement(parentPath.parent) ||
                    t.isProgram(parentPath.parent),
            );
            loc = externalNode.node.loc.end;
        }

        if (loc) {
            return { line: loc.line, column: loc.column };
        }
    }

    return null;
}
