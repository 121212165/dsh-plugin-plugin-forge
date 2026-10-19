/**
 * 骨架模板：给定 short name + 少量元信息，产出过 verify-plugin.mjs 的全部文件。
 * 生成物默认只回显（不落盘）；写盘走 forge_new 工具的 allowWrite 门禁。
 */

export interface ForgeInput {
  short: string; // 形如 pc-tuner（不带 dsh-plugin- 前缀）
  description: string;
  keywords?: string[];
  provide?: string[]; // inject 的服务，默认 commands/tools
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

export function normalizeShort(input: string): string | ForgeError {
  const short = input.trim().toLowerCase().replace(/^dsh-plugin-/, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!short) return { error: 'short 名为空。给个像「my-tool」那样的短名。' };
  if (short.length > 40) return { error: `short 名过长（${short.length}）：≤40 字符。` };
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(short)) return { error: `short 名「${short}」需形如 my-tool（小写字母开头，-分段）。` };
  return short;
}

const PROVIDE_CLAUSE = (provide: readonly string[]): string =>
  [`import type {} from '@deepseek-ai/dsh-commands';`, ...(provide.includes('tools') ? [`import type {} from '@deepseek-ai/dsh-system-prompt';`] : [])].filter(Boolean).join('\n');

export function forgeFiles(input: ForgeInput): ForgeError | { short: string; files: GeneratedFile[] } {
  const short = normalizeShort(input.short);
  if (typeof short !== 'string') return short;
  const name = `dsh-plugin-${short}`;
  const provide = input.provide?.length ? input.provide : ['commands', 'tools'];
  if (provide.some((service) => !['commands', 'tools', 'systemPrompt', 'sessions', 'llm', 'agents'].includes(service))) {
    return { error: `provide 只能是 commands/tools/systemPrompt/sessions/llm/agents 之一若干，收到：${provide.join(',')}` };
  }
  const year = input.year ?? new Date().getFullYear();
  const author = input.author ?? '';
  const camel = short.split('-').map((part) => part.replace(/^./, (ch) => ch.toUpperCase())).join('');

  const pkg = JSON.stringify(
    {
      name,
      version: '0.1.0',
      description: input.description,
      keywords: (input.keywords?.length ? input.keywords : ['dsh', 'deepseek-harness', 'cordis', 'plugin', short]).slice(0, 10),
      type: 'module',
      license: 'MIT',
      author,
      main: './lib/index.js',
      types: './lib/index.d.ts',
      sideEffects: false,
      exports: { '.': { types: './lib/index.d.ts', default: './lib/index.js' } },
      files: ['lib', 'README.md', 'icon.svg'],
      repository: { type: 'git', url: 'https://github.com/121212165/dsh-plugin-family' },
      scripts: {
        build: 'tsc -p tsconfig.build.json',
        start: 'tsc -w -p tsconfig.build.json',
        test: 'node --test "test/*.test.ts"',
        check: 'pnpm build 2>nul & node --test "test/*.test.ts"',
      },
      engines: { node: '>=22.18.0', pnpm: '>=10.0.0' },
      dependencies: {},
      devDependencies: {
        '@deepseek-ai/cordis': '^4.0.2',
        '@deepseek-ai/dsh-base': '^0.1.2-alpha.4',
        '@deepseek-ai/schemastery': '^3.18.2',
        '@types/node': '^26.6.2',
        typescript: '^7.0.2',
      },
      dsh: { bundle: { patch: 'cordis.patch.yml', src: 'src', test: 'test' } },
    },
    null,
    2,
  );

  const tsconfig = `{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false,
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "noEmit": false,
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "target": "es2024",
    "types": ["node"],
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib"]
}`;

  const tsconfigBuildJson = `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "lib"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib", "test"]
}`;

  const patch = `- insert:
    - id: ${short}
      name: ${name}
      config:
        enabled: true
        # dataDir: ~/.dsh/${short}
        order: 790
`;

  const readme = `# ${name}

> **dsh 插件家族**：23 个插件同一目录 **[dsh-plugin-family](https://github.com/121212165/dsh-plugin-family)**。

**EN** — TODO: one-line English summary.

**中文** —— ${input.description}

## 用法

- TODO

## 配置

| 字段 | 默认 | 说明 |
|---|---|---|
| \`enabled\` | \`true\` | |
| \`dataDir\` | \`~/.dsh/${short}\` | |
| \`order\` | \`790\` | |

## 限制

- TODO
`;

  const gitignore = `node_modules/
lib/
*.log
`;

  const license = `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

  const srcPlugin = `/**
 * dsh wiring for ${short}：TODO 一句话职责。
 */
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
${PROVIDE_CLAUSE(provide)}

export const name = '${short}';
export const inject = [${provide.map((service) => `'${service}'`).join(', ')}];

export interface Config {
  enabled: boolean;
  dataDir?: string;
  order: number;
}

export const Config = Schema.object({
  enabled: Schema.boolean().default(true),
  dataDir: Schema.string(),
  order: Schema.number().default(790),
});

export function apply(ctx: Context, config: Config): void {
  const log = ctx.logger(name);
  if (!config.enabled) return void log.info('disabled by config');

  ctx.commands.register({
    name: '${short.replace(/-/g, '_')}',
    description: 'TODO 动作说明',
    input: { hint: '<动作> …' },
    handler: ({ rawInput }) => {
      // TODO
      return { kind: 'success', text: \`TODO \${String(rawInput ?? '')}\` };
    },
  });

  ctx.tools.register(
    defineTool({
      name: '${short.replace(/-/g, '_')}_check',
      description: 'TODO 工具说明',
      parameters: {},
      output: { schema: { type: 'string' } as const, render: (_args, value) => [{ type: 'text', text: value }] },
      presentCall: () => ({ card: 'generic' as const, title: '${short}', kind: 'search' as const }),
      presentResult: (_args, value) => ({ card: 'generic' as const, title: String(value).slice(0, 40), kind: 'search' as const, rawInput: value }),
      async execute(_args: Record<string, never>): Promise<string> {
        return 'TODO';
      },
    }),
  );

  log.info('mounted · order=' + String(config.order));
}
`;

  const srcIndex = `export { name, Config, apply, inject } from './plugin.ts';
export type { Config as ${camel}Config } from './plugin.ts';
`;

  const srcTest = `/** 装配测试（不接真实 DSH，用 mock ctx）。 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { apply } from '../src/plugin.ts';

const commands: Array<{ name: string; handler: (args: { rawInput?: string }) => { kind: string; text: string } }> = [];
const tools: Array<{ name: string; execute: (args?: Record<string, unknown>) => Promise<string> }> = [];
apply(
  {
    logger: () => ({ info() {}, warn() {} }),
    commands: { register(definition: never) { commands.push(definition as never); } },
    tools: { register(definition: never) { tools.push(definition as never); } },
  } as never,
  { enabled: true, order: 790 },
);

test('命令注册到位且返回 success', async () => {
  const command = commands.find((entry) => entry.name === '${short.replace(/-/g, '_')}')!;
  const out = command.handler({ rawInput: 'demo' });
  assert.equal(out.kind, 'success');
  assert.match(out.text, /demo/);
});

test('tools: 骨架工具 execute({}) 走通', async () => {
  const tool = tools.find((entry) => entry.name === '${short.replace(/-/g, '_')}_check')!;
  assert.equal(await tool.execute({}), 'TODO');
});
`;

  return {
    short,
    files: [
      { path: 'package.json', content: `${pkg}\n` },
      { path: 'tsconfig.json', content: `${tsconfig}\n` },
      { path: 'tsconfig.build.json', content: `${tsconfigBuildJson}\n` },
      { path: 'cordis.patch.yml', content: patch },
      { path: 'README.md', content: readme },
      { path: '.gitignore', content: gitignore },
      { path: 'LICENSE', content: license },
      { path: 'src/plugin.ts', content: srcPlugin },
      { path: 'src/index.ts', content: srcIndex },
      { path: `test/${short.replace(/-/g, '_')}.test.ts`, content: srcTest },
    ],
  };
}
