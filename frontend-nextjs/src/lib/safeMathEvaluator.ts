/**
 * Safe Token-Based Arithmetic Evaluator for Gurukul AI
 * Evaluates mathematical expressions using BODMAS order of operations
 * WITHOUT eval(), new Function(), or dynamic code execution.
 */
export function evaluateSafeArithmetic(expression: string): number | null {
  if (!expression || typeof expression !== 'string' || expression.length > 200) {
    return null;
  }

  const cleanExpr = expression.trim().toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');

  // Reject unsupported characters (% and non-math chars)
  if (!/^[0-9\+\-\*\/\(\)\.\s]+$/.test(cleanExpr) || !/[\+\-\*\/]/.test(cleanExpr)) {
    return null;
  }

  // Tokenize & Validate Syntax
  const tokens: string[] = [];
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
        if (dotCount > 1) return null; // Reject multiple decimal points like 1..2
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
          // Tokenize as Unary Minus Operator '~'
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

  // Reject consecutive operators like 2++3, 2**3
  for (let t = 0; t < tokens.length - 1; t++) {
    const curr = tokens[t];
    const next = tokens[t + 1];
    if (['+', '-', '*', '/', '~'].includes(curr) && ['+', '*', '/'].includes(next)) {
      return null; // Reject consecutive operators
    }
    // Reject implicit multiplication like 2(3)
    if (!isNaN(Number(curr)) && next === '(') {
      return null;
    }
  }

  // Parse expression using Shunting Yard Algorithm
  const outputQueue: number[] = [];
  const operatorStack: string[] = [];
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '~': 3 };

  const applyOperator = () => {
    const op = operatorStack.pop();
    if (!op) throw new Error('Invalid expression');
    if (op === '~') {
      if (outputQueue.length < 1) throw new Error('Invalid expression');
      const val = outputQueue.pop()!;
      outputQueue.push(-val);
      return;
    }
    if (outputQueue.length < 2) throw new Error('Invalid expression');
    const b = outputQueue.pop()!;
    const a = outputQueue.pop()!;
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
          return null; // Mismatched parentheses
        }
        operatorStack.pop(); // Pop '('
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
