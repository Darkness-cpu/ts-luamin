declare module "luamin" {
  export type LuaparseOptions = {
    comments?: boolean;
    scope?: boolean;
  };

  export interface Luaparse {
    parse: (code: string, options?: LuaparseOptions) => any;
    defaultOptions: LuaparseOptions;
  }

  export const PRECEDENCE: Record<string, number>;

  export const IDENTIFIER_PARTS: string[];
  export const IDENTIFIER_PARTS_MAX: number;

  export const regexAlphaUnderscore: RegExp;
  export const regexAlphaNumUnderscore: RegExp;
  export const regexDigits: RegExp;

  export const each: <T>(
    array: T[],
    fn: (item: T, isLast: boolean) => void
  ) => void;

  export const indexOf: <T>(array: T[], value: T) => number;

  export const extend: <T, U>(destination: T, source: U) => T & U;

  export const generateZeroes: (length: number) => string;

  export const isKeyword: (id: string) => boolean;

  export const generateIdentifier: (originalName: string) => string;

  export const joinStatements: (
    a: string,
    b: string,
    separator?: string
  ) => string;

  export const formatBase: (base: any) => string;

  export const formatExpression: (
    expression: any,
    options?: {
      precedence?: number;
      preserveIdentifiers?: boolean;
    }
  ) => string;

  export interface Luamin {
    parse(code: string): any;
    formatExpression(expression: any): string;
  }
}
