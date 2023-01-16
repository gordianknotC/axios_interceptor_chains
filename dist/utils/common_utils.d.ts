export declare function wait(span: number): Promise<boolean>;
export declare function ensureNoRaise<T>(action: () => T, defaults: (error?: any) => T): T;
export declare function ensureCanProcessFulFill(action: () => boolean): boolean;
export declare function ensureCanReject(action: () => boolean): boolean;
