/** template.ts / validate.ts：骨架产出 + 体检口径。 */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, after } from 'node:test';

import { forgeFiles, normalizeShort } from '../src/template.ts';
import { renderValidate, validatePlugin } from '../src/validate.ts';

test('normalizeShort：清洗与拒收', () => {
  const first = normalizeShort(' my_tool ');
  assert.ok(typeof first === 'string');
  assert.equal(first, 'my-tool');
  assert.equal(normalizeShort('dsh-plugin-my-tool'), 'my-tool');
  assert.equal(normalizeShort('My-Tool'), 'my-tool');
  assert.ok(typeof normalizeShort('  ') === 'object');
  assert.ok(typeof normalizeShort('工具') === 'object'); // 非 ascii → 清洗后空
  assert.ok(typeof normalizeShort('-') === 'object');
});

test('forgeFiles：10 文件 + 内容口径', () => {
  const result = forgeFiles({ short: 'demo-tool', description: '测试插件', keywords: ['x'], year: 2024, author: 'tester' });
  assert.ok(!('error' in result));
  const { files } = result;
  assert.deepEqual(files.map((file): string => file.path).sort(), [
    '.gitignore', 'LICENSE', 'README.md', 'cordis.patch.yml', 'package.json', 'src/index.ts', 'src/plugin.ts', 'test/demo_tool.test.ts', 'tsconfig.build.json', 'tsconfig.json',
  ].sort());

  const pkg = JSON.parse(files.find((file) => file.path === 'package.json')!.content) as Record<string, unknown>;
  assert.equal(pkg.name, 'dsh-plugin-demo-tool');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.sideEffects, false);
  assert.deepEqual(pkg.dependencies, {});
  const scripts = pkg.scripts as Record<string, string>;
  for (const script of ['build', 'start', 'test', 'check']) assert.ok(scripts[script]);
  const engines = pkg.engines as Record<string, string>;
  assert.match(String(engines.node), /22\.18/);
  assert.ok((pkg.dsh as { bundle: { patch: string } }).bundle.patch);

  const plugin = files.find((file) => file.path === 'src/plugin.ts')!.content;
  assert.match(plugin, /export const name = 'demo-tool'/);
  assert.match(plugin, /demo_tool_check/);
  const test = files.find((file) => file.path === 'test/demo_tool.test.ts')!.content;
  assert.match(test, /demo_tool_check/);
});

test('forgeFiles：非法 provide 拒收', () => {
  const bad = forgeFiles({ short: 'demo', description: 'x', provide: ['keyboard'] });
  assert.ok(typeof bad === 'object' && 'error' in bad);
  const ok = forgeFiles({ short: 'demo', description: 'x', provide: ['commands', 'systemPrompt'] });
  assert.ok(typeof ok === 'object' && !('error' in ok));
  assert.match(ok.files.find((file) => file.path === 'src/plugin.ts')!.content, /systemPrompt/);
});

const dir = mkdtempSync(join(tmpdir(), 'forge-val-'));
after(() => rmSync(dir, { recursive: true, force: true }));

test('validatePlugin：空目录全缺；合法目录全过', () => {
  const empty = validatePlugin(join(dir, 'nope'));
  assert.equal(empty.ok, false);
  assert.ok(readAll(empty).some((line) => line.includes('package.json')));

  const stub = forgeFiles({ short: 'stub', description: 'x' });
  assert.ok(typeof stub === 'object' && !('error' in stub));
  const good = join(dir, 'good');
  mkdirSync(join(good, 'src'), { recursive: true });
  mkdirSync(join(good, 'test'), { recursive: true });
  for (const file of stub.files) writeFileSync(join(good, file.path), file.content, 'utf8');
  const report = validatePlugin(good);
  const missing = readAll(report).filter((line) => line.includes('✗'));
  // 唯一允许缺的是 lib/（未 build）
  assert.deepEqual(missing.map((line) => line.trim()), ['✗ lib/ 已 build（verify-plugin.mjs 需要）']);
  assert.ok(existsSync(join(good, 'src', 'index.ts')));
});

function readAll(report: { checks: Array<{ item: string; ok: boolean; detail?: string | undefined }> }): string[] {
  return report.checks.map((check) => (check.ok ? '✓' : '✗') + ' ' + check.item);
}

test('renderValidate：命中缺口时报 scripts.build 提示', () => {
  const bad = validatePlugin(join(dir, 'nope-2'));
  const text = renderValidate(bad);
  assert.match(text, /缺 \d+ 项/);
  assert.match(text, /scripts\.build/);
});
