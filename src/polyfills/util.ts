// Util polyfill for Google Cloud libraries
// @ts-nocheck

import promisify from 'util-promisify';

// Create a standalone util object with essential functions
const util = {
  // Basic util functions
  inspect: (obj: any, options?: any) => {
    if (typeof obj === 'string') return obj;
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'function') return '[Function]';
    if (typeof obj === 'object') {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(obj);
  },
  
  format: (format: string, ...args: any[]) => {
    return format.replace(/%[sdj%]/g, (match) => {
      if (match === '%%') return '%';
      const arg = args.shift();
      if (match === '%s') return String(arg);
      if (match === '%d') return Number(arg);
      if (match === '%j') return JSON.stringify(arg);
      return match;
    });
  },
  
  // Add promisify function
  promisify: promisify,
  
  // Add other essential util functions
  isArray: Array.isArray,
  isBoolean: (value: any) => typeof value === 'boolean',
  isNull: (value: any) => value === null,
  isNullOrUndefined: (value: any) => value === null || value === undefined,
  isNumber: (value: any) => typeof value === 'number',
  isObject: (value: any) => typeof value === 'object' && value !== null,
  isString: (value: any) => typeof value === 'string',
  isSymbol: (value: any) => typeof value === 'symbol',
  isUndefined: (value: any) => typeof value === 'undefined',
  isFunction: (value: any) => typeof value === 'function',
  isDate: (value: any) => value instanceof Date,
  isError: (value: any) => value instanceof Error,
  isRegExp: (value: any) => value instanceof RegExp,
  
  // Add callbackify function (reverse of promisify)
  callbackify: (fn: any) => {
    return (...args: any[]) => {
      const callback = args.pop();
      Promise.resolve(fn(...args))
        .then((result: any) => callback(null, result))
        .catch((err: any) => callback(err));
    };
  }
};

// Export the util object
export default util;
export { promisify };
