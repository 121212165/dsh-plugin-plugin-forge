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
export declare const Config: Schema<Schemastery.ObjectS<NoInfer<{
    enabled: Schema<boolean, boolean, "defined">;
    workspaceRoot: Schema<string, string, "defined">;
    allowWrite: Schema<boolean, boolean, "defined">;
    order: Schema<number, number, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    enabled: Schema<boolean, boolean, "defined">;
    workspaceRoot: Schema<string, string, "defined">;
    allowWrite: Schema<boolean, boolean, "defined">;
    order: Schema<number, number, "defined">;
}>>, "plain">;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=plugin.d.ts.map