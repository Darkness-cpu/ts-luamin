declare module "lunmin" {
  // ตัวอย่างการกำหนด type
  export interface LuaParseOptions {
    comments: boolean;
    scope: boolean;
  }

  export interface LuaParse {
    defaultOptions: LuaParseOptions;
    parse(code: string): any;
  }

  export function generateIdentifier(originalName: string): string;

  export function formatBase(base: any): string;

  export function formatExpression(expression: any, options?: { precedence?: number; preserveIdentifiers?: boolean }): string;

  export function formatArguments(argumentsList: any[]): string;

  export function formatFunction(func: any): string;
}
