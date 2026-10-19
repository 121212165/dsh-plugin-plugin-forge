/** 装配测试：不写盘场景 + allowWrite 门禁。 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, after } from 'node:test';

import { apply } from '../src/plugin.ts';

const root = mkdtempSync(join(tmpdir(), 'forge-wire-'));
after(() => rmSync(root, { recursive: true, force: true }));

interface Command { name: string; handler: (args: { rawInput?: string }) => { kind: string; text: string } }
interface Tool { name: string; execute: (args: Record<string, unknown>) => Promise<string> }

const commands: Command[] = [];
const tools: Tool[] = [];
const mkCtx = (): never => ({ logger: () => ({ info() {}, warn() {} }), commands: { register(definition: never) { commands.push(definition as never); } }, tools: { register(definition: never) { tools.push(definition as never); } } } as never);

apply(mkCtx(), { enabled: true, workspaceRoot: root, allowWrite: false, order: 790 });
const forge = () => commands.find((entry) => entry.name === 'forge')!;

test('/forge new：回显 10 文件 + 不落盘', () => {
  const out = forge().handler({ rawInput: 'new hopper 产出跳板说明的插件' });
  assert.equal(out.kind, 'success');
  assert.match(out.text, /拟生成 .*dsh-plugin-hopper/);
  assert.match(out.text, /10 个文件/);
  assert.ok(!existsSync(join(root, 'dsh-plugin-hopper')));
});

test('/forge new!：allowWrite=false 拒写并回显', () => {
  const out = forge().handler({ rawInput: 'new! hopper 描述' });
  assert.match(out.text, /写盘被拒/);
  assert.ok(!existsSync(join(root, 'dsh-plugin-hopper')));
});

test('/forge check：short 名展开成目录', () => {
  const out = forge().handler({ rawInput: 'check nope' });
  assert.match(out.text, /dsh-plugin-nope/);
  assert.match(out.text, /缺 \d+ 项/);
});

test('/forge list：列 workspace', () => {
  const out = forge().handler({ rawInput: 'list' });
  assert.match(out.text, /共 \d+ 个插件/);
});

test('tools: forge_check 走通', async () => {
  const tool = tools.find((entry) => entry.name === 'forge_check')!;
  const text = await tool.execute({ dir: 'nope' });
  assert.match(text, /缺 \d+ 项/);
});
