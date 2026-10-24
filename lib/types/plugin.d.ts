import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "plugin-forge";
export declare const inject: string[];
export interface Config {
    enabled: boolean;
    workspaceRoot: string;
    allowWrite: boolean;
    order: number;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enabled: Schema<boolean, boolean>;
    workspaceRoot: Schema<string, string>;
    allowWrite: Schema<boolean, boolean>;
    order: Schema<number, number>;
}>, Schemastery.ObjectT<{
    enabled: Schema<boolean, boolean>;
    workspaceRoot: Schema<string, string>;
    allowWrite: Schema<boolean, boolean>;
    order: Schema<number, number>;
}>>;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=plugin.d.ts.map