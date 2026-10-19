/**
 * dsh wiring for plugin-forge：插件骨架生成与体检。
 * /forge new <short> 生成骨架（默认回显；allowWrite=true 才落盘）；
 * /forge check [目录] 体检现有插件；forge_new / forge_check 工具给 Agent 用。
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import type {} from '@deepseek-ai/dsh-commands';

import { forgeFiles, type ForgeInput, type GeneratedFile } from './template.ts';
import { renderValidate, validatePlugin } from './validate.ts';

export const name = 'plugin-forge';
export const inject = ['commands', 'tools'];

export interface Config {
  enabled: boolean;
  workspaceRoot: string;
  allowWrite: boolean;
  order: number;
}

export const Config = Schema.object({
  enabled: Schema.boolean().default(true),
  workspaceRoot: Schema.string().default('C:\\Users\\lenovo\\.zcode\\workspace\\default'),
  allowWrite: Schema.boolean().default(false),
  order: Schema.number().default(790),
});

export function apply(ctx: Context, config: Config): void {
  const log = ctx.logger(name);
  if (!config.enabled) return void log.info('disabled by config');

  const dirFor = (short: string): string => `${config.workspaceRoot}\\dsh-plugin-${short}`;

  const renderForge = (input: ForgeInput, write: boolean): string => {
    const result = forgeFiles(input);
    if ('error' in result) return `生成失败：${result.error}`;
    const dir = dirFor(result.short);
    if (write) {
      if (!config.allowWrite) return `写盘被拒：config.allowWrite=false。以下为生成内容（未落盘）：\n\n${renderFiles(result.files, dir)}`;
      try {
        writeAll(dir, result.files);
        return `已写入 ${dir} ${result.files.length} 个文件。\n下一步：pnpm i → 填 TODO → pnpm build → node tools/verify-plugin.mjs ${dir}`;
      } catch (error) {
        return `写盘失败：${String(error)}`;
      }
    }
    return renderFiles(result.files, dir);
  };

  ctx.commands.register({
    name: 'forge',
    description: '插件脚手架：/forge new <short> [描述…] 生成骨架 | /forge check <目录或 short> 体检 | /forge list 列 workspace 插件',
    input: { hint: 'new|check|list …' },
    handler: ({ rawInput }) => {
      const raw = String(rawInput ?? '').trim();
      const [verb = '', ...rest] = raw.split(/\s+/);
      if (verb === 'new') {
        const short = rest.shift() ?? '';
        const description = rest.join(' ') || `dsh 插件：${short}。TODO 完善描述。`;
        return { kind: 'success', text: renderForge({ short, description }, false) };
      }
      if (verb === 'new!') {
        const short = rest.shift() ?? '';
        const description = rest.join(' ') || `dsh 插件：${short}。TODO 完善描述。`;
        return { kind: 'success', text: renderForge({ short, description }, true) };
      }
      if (verb === 'check') {
        const target = rest[0] ?? config.workspaceRoot;
        const dir = target.match(/^[a-zA-Z]:[\\/]/) ? target : dirFor(target.replace(/^dsh-plugin-/, ''));
        return { kind: 'success', text: renderValidate(validatePlugin(dir)) };
      }
      if (verb === 'list') {
        const found = readdirSync(config.workspaceRoot).filter((entry) => entry.startsWith('dsh-plugin-')).sort();
        return { kind: 'success', text: `workspace 共 ${found.length} 个插件：\n${found.join('\n')}` };
      }
      return { kind: 'error', text: `不认识的动作「${verb}」。可用：new / new! (写盘) / check / list` };
    },
  });

  ctx.tools.register(
    defineTool({
      name: 'forge_new',
      description: '生成新 dsh 插件骨架（10 个文件，元数据过 verify-plugin.mjs）。默认只回显内容；落盘需 config.allowWrite=true。给"帮我新建一个 dsh 插件"的场景用。',
      parameters: {
        short: { type: 'string', required: true, description: '短名，如 my-tool（自动加 dsh-plugin- 前缀）' },
        description: { type: 'string', required: true, description: '一句话职责' },
      },
      output: { schema: { type: 'string' } as const, render: (_args, value) => [{ type: 'text', text: value }] },
      presentCall: () => ({ card: 'generic' as const, title: 'forge new', kind: 'edit' as const }),
      presentResult: (_args, value) => ({ card: 'generic' as const, title: String(value).split('\n')[0]!.slice(0, 40), kind: 'edit' as const, rawInput: value }),
      async execute(args) {
        return renderForge({ short: String(args.short ?? ''), description: String(args.description ?? '') }, false);
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: 'forge_check',
      description: '体检一个现有 dsh 插件目录：SDS 元数据字段、五件套 scripts、lib 产物等是否齐全。验收前自查用。',
      parameters: {
        dir: { type: 'string', required: true, description: '插件目录（绝对路径或 workspace 内 short 名）' },
      },
      output: { schema: { type: 'string' } as const, render: (_args, value) => [{ type: 'text', text: value }] },
      presentCall: () => ({ card: 'generic' as const, title: 'forge check', kind: 'search' as const }),
      presentResult: (_args, value) => ({ card: 'generic' as const, title: String(value).split('\n')[0]!.slice(0, 40), kind: 'search' as const, rawInput: value }),
      async execute(args) {
        const target = String(args.dir ?? '');
        const dir = target.match(/^[a-zA-Z]:[\\/]/) ? target : dirFor(target.replace(/^dsh-plugin-/, ''));
        return renderValidate(validatePlugin(dir));
      },
    }),
  );

  log.info(`mounted · root=${config.workspaceRoot} · allowWrite=${config.allowWrite} order=${config.order}`);
}

function renderFiles(files: readonly GeneratedFile[], dir: string): string {
  return `拟生成 ${dir}（${files.length} 个文件）：\n${files.map((file) => `  ${file.path}（${file.content.length}B）`).join('\n')}\n\n内容预览见 forge_files 输出或 /forge new! 落盘（需 allowWrite）。`;
}

function writeAll(dir: string, files: readonly GeneratedFile[]): void {
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'test'), { recursive: true });
  for (const file of files) writeFileSync(join(dir, file.path), file.content, 'utf8');
}
