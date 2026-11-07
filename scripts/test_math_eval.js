function evaluateSafeArithmetic(expression) {
  if (!expression || typeof expression !== 'string' || expression.length > 200) {
    return null;
  }

  const cleanExpr = expression.trim().toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');

  if (!/^[0-9\+\-\*\/\(\)\.\s]+$/.test(cleanExpr) || !/[\+\-\*\/]/.test(cleanExpr)) {
    return null;
  }

  const tokens = [];
  let i = 0;
  while (i < cleanExpr.length) {
    const char = cleanExpr[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9\.]/.test(char)) {
      let numStr = '';
      let dotCount = 0;
      while (i < cleanExpr.length && /[0-9\.]/.test(cleanExpr[i])) {
        if (cleanExpr[i] === '.') dotCount++;
        if (dotCount > 1) return null;
        numStr += cleanExpr[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }

    if (['+', '-', '*', '/', '(', ')'].includes(char)) {
      if (char === '-') {
        const prevToken = tokens[tokens.length - 1];
        if (!prevToken || ['+', '-', '*', '/', '(', '~'].includes(prevToken)) {
          tokens.push('~');
          i++;
          continue;
        }
      }
      tokens.push(char);
      i++;
      continue;
    }

    return null;
  }

  for (let t = 0; t < tokens.length - 1; t++) {
    const curr = tokens[t];
    const next = tokens[t + 1];
    if (['+', '-', '*', '/', '~'].includes(curr) && ['+', '*', '/'].includes(next)) {
      return null;
    }
    if (!isNaN(Number(curr)) && next === '(') {
      return null;
    }
  }

  const outputQueue = [];
  const operatorStack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '~': 3 };

  const applyOperator = () => {
    const op = operatorStack.pop();
    if (!op) throw new Error('Invalid expression');
    if (op === '~') {
      if (outputQueue.length < 1) throw new Error('Invalid expression');
      const val = outputQueue.pop();
      outputQueue.push(-val);
      return;
    }
    if (outputQueue.length < 2) throw new Error('Invalid expression');
    const b = outputQueue.pop();
    const a = outputQueue.pop();
    switch (op) {
      case '+': outputQueue.push(a + b); break;
      case '-': outputQueue.push(a - b); break;
      case '*': outputQueue.push(a * b); break;
      case '/':
        if (b === 0) throw new Error('Division by zero');
        outputQueue.push(a / b);
        break;
      default: throw new Error('Unknown operator');
    }
  };

  try {
    for (const token of tokens) {
      if (!isNaN(Number(token))) {
        outputQueue.push(Number(token));
      } else if (['+', '-', '*', '/', '~'].includes(token)) {
        const isRightAssociative = token === '~';
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          (isRightAssociative
            ? precedence[operatorStack[operatorStack.length - 1]] > precedence[token]
            : precedence[operatorStack[operatorStack.length - 1]] >= precedence[token])
        ) {
          applyOperator();
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          applyOperator();
        }
        if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
          return null;
        }
        operatorStack.pop();
      }
    }

    while (operatorStack.length > 0) {
      if (operatorStack[operatorStack.length - 1] === '(') return null;
      applyOperator();
    }

    if (outputQueue.length !== 1 || !isFinite(outputQueue[0])) {
      return null;
    }

    return outputQueue[0];
  } catch {
    return null;
  }
}

const cases = [
  ['2+3*4', 14],
  ['(2+3)*4', 20],
  ['10 - -17', 27],
  ['-(2+3)', -5],
  ['2*-(3)', -6],
  ['2*(-(3+1))', -8],
  ['2* - (3)', -6],
  ['2 / -(4)', -0.5],
  ['5 + -(2)', 3],
  ['5 - -(2)', 7],
  ['--2', 2],
  ['- -2', 2],
  ['1.5+2.5', 4],
  ['8/2*2', 8],
  ['2*(3+4)', 14],
  ['2--3', 5],
  ['-2*3', -6],
  ['(-2)*(-3)', 6],
  ['10/0', null],
  ['1..2', null],
  ['2++3', null],
  ['(2+3', null],
  ['2+3)', null],
  ['2(3)', null],
  ['()', null],
  ['2+', null],
  ['Infinity', null],
  ['NaN', null]
];

console.log('=== SAFE MATH EVALUATOR 28-CASE REGRESSION MATRIX ===');
let passCount = 0;
for (const [expr, expected] of cases) {
  const actual = evaluateSafeArithmetic(expr);
  const ok = actual === expected;
  if (ok) passCount++;
  console.log((ok ? '✓ PASS: ' : '✗ FAIL: ') + "'" + expr + "' => " + actual + " (Expected: " + expected + ")");
}
console.log('Passed ' + passCount + ' / ' + cases.length + ' regression tests.');
if (passCount !== cases.length) {
  process.exit(1);
}
