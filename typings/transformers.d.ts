// Declaration file for @xenova/transformers
declare module "@xenova/transformers" {
  export function pipeline(task: string, model: string, options?: any): Promise<any>;
}
