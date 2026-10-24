/**
 * 现有插件体检：对照 SDS 元数据/结构清单报告缺什么（对应 verify-plugin.mjs 的口径）。
 */
export interface Check {
    item: string;
    ok: boolean;
    detail?: string | undefined;
}
export interface ValidateReport {
    dir: string;
    name?: string | undefined;
    checks: Check[];
    ok: boolean;
}
export declare function validatePlugin(dir: string): ValidateReport;
export declare function renderValidate(report: ValidateReport): string;
//# sourceMappingURL=validate.d.ts.map