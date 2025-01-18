/**
 * Generate a unique identifier based on the given name.
 * @param {string} originalName - The original name to convert.
 * @returns {string} The generated identifier.
 */
export function generateIdentifier(originalName) {
  if (originalName === "self") return originalName;
  return `_${originalName}`;
}

/**
 * Format the given base into a string representation.
 * @param {*} base - The base object or value to format.
 * @returns {string} The formatted base as a string.
 */
export function formatBase(base) {
  return JSON.stringify(base);
}

/**
 * Format a Lua expression with optional options.
 * @param {*} expression - The expression to format.
 * @param {{ precedence?: number, preserveIdentifiers?: boolean }} [options] - Optional formatting options.
 * @returns {string} The formatted expression.
 */
export function formatExpression(expression, options = {}) {
  const { precedence = 0, preserveIdentifiers = false } = options;
  return `Expression: ${JSON.stringify(expression)}, Precedence: ${precedence}, Preserve: ${preserveIdentifiers}`;
}

/**
 * Format a list of arguments into a string.
 * @param {Array} argumentsList - The list of arguments to format.
 * @returns {string} The formatted arguments.
 */
export function formatArguments(argumentsList) {
  return argumentsList.map((arg, index) => `Arg${index + 1}: ${arg}`).join(", ");
}

/**
 * Format a Lua function into a string representation.
 * @param {*} func - The function to format.
 * @returns {string} The formatted function as a string.
 */
export function formatFunction(func) {
  return `Function: ${JSON.stringify(func)}`;
}

// Default options for Lua parsing
export const defaultOptions = {
  comments: true,
  scope: true,
};

// Export an object for easier access to all functions
export default {
  generateIdentifier,
  formatBase,
  formatExpression,
  formatArguments,
  formatFunction,
  defaultOptions,
};
