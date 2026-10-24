/**
 * 骨架模板：给定 short name + 少量元信息，产出过 verify-plugin.mjs 的全部文件。
 * 生成物默认只回显（不落盘）；写盘走 forge_new 工具的 allowWrite 门禁。
 */
export interface ForgeInput {
    short: string;
    description: string;
    keywords?: string[];
    provide?: string[];
    year?: number;
    author?: string;
}
export interface GeneratedFile {
    path: string;
    content: string;
}
export interface ForgeError {
    error: string;
}
export declare function normalizeShort(input: string): string | ForgeError;
export declare function forgeFiles(input: ForgeInput): ForgeError | {
    short: string;
    files: GeneratedFile[];
};
//# sourceMappingURL=template.d.ts.map