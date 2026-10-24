/**
 * 现有插件体检：对照 SDS 元数据/结构清单报告缺什么（对应 verify-plugin.mjs 的口径）。
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const REQUIRED_FILES = ['package.json', 'tsconfig.json', 'tsconfig.build.json', 'cordis.patch.yml', 'README.md', 'LICENSE'];
const REQUIRED_SRC = ['src/index.ts', 'src/plugin.ts'];
const REQUIRED_FIELDS = ['name', 'version', 'description', 'type', 'license', 'main', 'types', 'exports', 'files', 'repository', 'engines', 'scripts', 'sideEffects'];
export function validatePlugin(dir) {
    const checks = [];
    const push = (item, ok, detail) => {
        checks.push(detail === undefined ? { item, ok } : { item, ok, detail });
    };
    for (const file of REQUIRED_FILES)
        push(`文件 ${file}`, existsSync(join(dir, file)));
    for (const file of REQUIRED_SRC)
        push(`文件 ${file}`, existsSync(join(dir, file)));
    push('目录 test/ 有测试', existsSync(join(dir, 'test')));
    let pkg;
    let name;
    if (existsSync(join(dir, 'package.json'))) {
        try {
            pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
            name = typeof pkg.name === 'string' ? pkg.name : undefined;
        }
        catch (error) {
            push('package.json 可解析', false, String(error));
        }
    }
    if (pkg && name) {
        for (const field of REQUIRED_FIELDS) {
            const value = pkg[field];
            const ok = field === 'sideEffects' ? value === false || Array.isArray(value) : value !== undefined && (!Array.isArray(value) || value.length > 0);
            push(`字段 ${field}`, ok);
        }
        const deps = pkg.dependencies;
        push('运行时 dependencies 为空（强制走 devDependencies/workspace）', !deps || Object.keys(deps).length === 0);
        const scripts = pkg.scripts;
        if (scripts)
            for (const script of ['build', 'start', 'test', 'check'])
                push(`script ${script}`, Boolean(scripts[script]));
        const engines = pkg.engines;
        if (engines) {
            push('engines.node ≥22.18', /22\.(1[89]|[2-9]\d)|^2[3-9]/.test(String(engines.node ?? '')));
            push('engines.pnpm', Boolean(engines.pnpm));
        }
        const dsh = pkg.dsh;
        push('dsh.bundle.patch 声明', Boolean(dsh && dsh.bundle?.patch));
        const exportsField = pkg.exports;
        push('exports 指到 lib', typeof exportsField === 'object' && JSON.stringify(exportsField).includes('./lib/index.js'));
    }
    const lib = existsSync(join(dir, 'lib', 'index.js'));
    push('lib/ 已 build（verify-plugin.mjs 需要）', lib, lib ? undefined : '跑 pnpm build 生成');
    return { dir, name: name ?? undefined, checks, ok: checks.every((check) => check.ok) };
}
export function renderValidate(report) {
    const bad = report.checks.filter((check) => !check.ok);
    const head = `${report.name ?? '未命名插件'} · ${report.dir}\n${bad.length ? `缺 ${bad.length} 项：` : '全部通过。'}`;
    const lines = bad.map((check) => `  ✗ ${check.item}${check.detail ? `（${check.detail}）` : ''}`);
    return [head, ...lines, bad.length ? 'scripts.build - 重跑再验' : ''].filter(Boolean).join('\n');
}
//# sourceMappingURL=validate.js.map