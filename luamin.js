function(root) {

	// Detect free variable `global`, from Node.js
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var luaparse = root.luaparse || require('luaparse');
	luaparse.defaultOptions.comments = false;
	luaparse.defaultOptions.scope = true;
	var parse = luaparse.parse;

	var regexAlphaUnderscore = /[a-zA-Z_]/;
	var regexAlphaNumUnderscore = /[a-zA-Z0-9_]/;
	var regexDigits = /[0-9]/;

	// http://www.lua.org/manual/5.2/manual.html#3.4.7
	// http://www.lua.org/source/5.2/lparser.c.html#priority
	var PRECEDENCE = {
		'or': 1,
		'and': 2,
		'<': 3, '>': 3, '<=': 3, '>=': 3, '~=': 3, '==': 3,
		'..': 5,
		'+': 6, '-': 6, // binary -
		'*': 7, '/': 7, '%': 7,
		'unarynot': 8, 'unary#': 8, 'unary-': 8, // unary -
		'^': 10
	};

	var IDENTIFIER_PARTS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a',
		'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
		'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E',
		'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
		'U', 'V', 'W', 'X', 'Y', 'Z', '_'];
	var IDENTIFIER_PARTS_MAX = IDENTIFIER_PARTS.length - 1;

	var each = function(array, fn) {
		var index = -1;
		var length = array.length;
		var max = length - 1;
		while (++index < length) {
			fn(array[index], index < max);
		}
	};

	var indexOf = function(array, value) {
		var index = -1;
		var length = array.length;
		while (++index < length) {
			if (array[index] == value) {
				return index;
			}
		}
	};

	var hasOwnProperty = {}.hasOwnProperty;
	var extend = function(destination, source) {
		var key;
		if (source) {
			for (key in source) {
				if (hasOwnProperty.call(source, key)) {
					destination[key] = source[key];
				}
			}
		}
		return destination;
	};

	var generateZeroes = function(length) {
		var zero = '0';
		var result = '';
		if (length < 1) {
			return result;
		}
		if (length == 1) {
			return zero;
		}
		while (length) {
			if (length & 1) {
				result += zero;
			}
			if (length >>= 1) {
				zero += zero;
			}
		}
		return result;
	};

	// http://www.lua.org/manual/5.2/manual.html#3.1
	function isKeyword(id) {
		switch (id.length) {
			case 2:
				return 'do' == id || 'if' == id || 'in' == id || 'or' == id;
			case 3:
				return 'and' == id || 'end' == id || 'for' == id || 'nil' == id ||
					'not' == id;
			case 4:
				return 'else' == id || 'goto' == id || 'then' == id || 'true' == id;
			case 5:
				return 'break' == id || 'false' == id || 'local' == id ||
					'until' == id || 'while' == id;
			case 6:
				return 'elseif' == id || 'repeat' == id || 'return' == id;
			case 8:
				return 'function' == id;
		}
		return false;
	}

	var currentIdentifier;
	var identifierMap;
	var identifiersInUse;
	var generateIdentifier = function(originalName) {
		// Preserve `self` in methods
		if (originalName == 'self') {
			return originalName;
		}

		if (hasOwnProperty.call(identifierMap, originalName)) {
			return identifierMap[originalName];
		}
		var length = currentIdentifier.length;
		var position = length - 1;
		var character;
		var index;
		while (position >= 0) {
			character = currentIdentifier.charAt(position);
			index = indexOf(IDENTIFIER_PARTS, character);
			if (index != IDENTIFIER_PARTS_MAX) {
				currentIdentifier = currentIdentifier.substring(0, position) +
					IDENTIFIER_PARTS[index + 1] + generateZeroes(length - (position + 1));
				if (
					isKeyword(currentIdentifier) ||
					indexOf(identifiersInUse, currentIdentifier) > -1
				) {
					return generateIdentifier(originalName);
				}
				identifierMap[originalName] = currentIdentifier;
				return currentIdentifier;
			}
			--position;
		}
		currentIdentifier = 'a' + generateZeroes(length);
		if (indexOf(identifiersInUse, currentIdentifier) > -1) {
			return generateIdentifier(originalName);
		}
		identifierMap[originalName] = currentIdentifier;
		return currentIdentifier;
	};

	/*--------------------------------------------------------------------------*/

	var joinStatements = function(a, b, separator) {
		separator || (separator = ' ');

		var lastCharA = a.slice(-1);
		var firstCharB = b.charAt(0);

		if (lastCharA == '' || firstCharB == '') {
			return a + b;
		}
		if (regexAlphaUnderscore.test(lastCharA)) {
			if (regexAlphaNumUnderscore.test(firstCharB)) {
				// e.g. `while` + `1`
				// e.g. `local a` + `local b`
				return a + separator + b;
			} else {
				// e.g. `not` + `(2>3 or 3<2)`
				// e.g. `x` + `^`
				return a + b;
			}
		}
		if (regexDigits.test(lastCharA)) {
			if (
				firstCharB == '(' ||
				!(firstCharB == '.' ||
				regexAlphaUnderscore.test(firstCharB))
			) {
				// e.g. `1` + `+`
				// e.g. `1` + `==`
				return a + b;
			} else {
				// e.g. `1` + `..`
				// e.g. `1` + `and`
				return a + separator + b;
			}
		}
		if (lastCharA == firstCharB && lastCharA == '-') {
			// e.g. `1-` + `-2`
			return a + separator + b;
		}
		return a + b;
	};

	var formatBase = function(base) {
		var result = '';
		var type = base.type;
		var needsParens = base.inParens && (
			type == 'BinaryExpression' ||
			type == 'FunctionDeclaration' ||
			type == 'TableConstructorExpression' ||
			type == 'LogicalExpression' ||
			type == 'StringLiteral'
		);
		if (needsParens) {
			result += '(';
		}
		result += formatExpression(base);
		if (needsParens) {
			result += ')';
		}
		return result;
	};

	var formatExpression = function(expression, options) {

		options = extend({
			'precedence': 0,
			'preserveIdentifiers': false
		}, options);

		var result = '';
		var currentPrecedence;
		var associativity;
		var operator;

		var expressionType = expression.type;

		if (expressionType == 'Identifier') {

			result = expression.isLocal && !options.preserveIdentifiers
				? generateIdentifier(expression.name)
				: expression.name;

		} else if (
			expressionType == 'StringLiteral' ||
			expressionType == 'NumericLiteral' ||
			expressionType == 'BooleanLiteral' ||
			expressionType == 'NilLiteral' ||
			expressionType == 'VarargLiteral'
		) {

			result = expression.raw;

		} else if (
			expressionType == 'LogicalExpression' ||
			expressionType == 'BinaryExpression'
			) {

			currentPrecedence = PRECEDENCE[expression.operator];
			if (currentPrecedence > options.precedence) {
				result = formatBase(expression.left);
				result = joinStatements(result, expression.operator);
				result = joinStatements(result, formatBase(expression.right), ' ');
			} else {
				associativity = expression.operator == 'and' || expression.operator == 'or'
					? 'left'
					: 'right';
				result = formatBase(expression.left);
				result = joinStatements(result, expression.operator);
				result = joinStatements(result, formatBase(expression.right), ' ');
			}

		} else if (
			expressionType == 'UnaryExpression'
		) {
			operator = expression.operator == '#' ? 'unary#' : expression.operator;
			currentPrecedence = PRECEDENCE[operator];

			if (currentPrecedence > options.precedence) {
				result = expression.operator + formatBase(expression.argument);
			} else {
				result = expression.operator + ' ' + formatBase(expression.argument);
			}

		} else if (expressionType == 'CallExpression') {
			result = formatBase(expression.callee) + '(' + joinStatements(formatArguments(expression.arguments)) + ')';
		} else if (expressionType == 'TableConstructorExpression') {
			result = '{' + joinStatements(formatArguments(expression.fields)) + '}';
		} else if (expressionType == 'FunctionDeclaration') {
			result = 'function' + joinStatements(formatArguments(expression.parameters)) + formatBase(expression.body);
		}

		return result;
	};

	var formatArguments = function(argumentsList) {
		var result = '';
		each(argumentsList, function(argument, isLast) {
			result += formatExpression(argument);
			if (!isLast) {
				result += ', ';
			}
		});
		return result;
	};

	var formatFunction = function(func) {
		return formatExpression(func);
	};

	// Expose functions for external usage
	root.luaparse = luaparse;
	root.formatBase = formatBase;
	root.formatExpression = formatExpression;
	root.formatArguments = formatArguments;
	root.formatFunction = formatFunction;

})(this);
