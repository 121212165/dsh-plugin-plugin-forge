# dsh-plugin-plugin-forge

> **dsh 插件家族**：23 个插件同一目录 **[dsh-plugin-family](https://github.com/121212165/dsh-plugin-family)**。

**EN** — Scaffold & validator for dsh plugins: `/forge new <short>` emits a 10-file skeleton (full SDS metadata, tsconfigs, patch, README, LICENSE, wiring + tests) that passes verify-plugin.mjs out of the box; `/forge check` audits an existing plugin against the SDS checklist; `forge_new` / `forge_check` tools for agents.

**中文** —— 插件脚手架：给一个 short 名（如 `my-tool`），产出元数据齐全、`verify-plugin.mjs` 直接过检的 10 文件骨架；默认只回显不落盘，`/forge new!` 或 config `allowWrite` 才写。`/forge check <short|目录>` 按联合国清单体检现有插件（字段/五件套 scripts/engines/lib 产物）；`/forge list` 列 workspace 全部插件。

## 用法

- **`/forge new <short> <描述>`** —— 生成骨架内容（回显）。
- **`/forge new! <short> <描述>`** —— 生成并落盘（需 `allowWrite`）。
- **`/forge check <short|绝对路径>`** —— 体检，报缺项清单。
- **`/forge list`** —— 列 workspace 全部 `dsh-plugin-*`。
- **`forge_new` / `forge_check` 工具** —— Agent 直接调用。

## 配置

| 字段 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | |
| `workspaceRoot` | `C:\Users\lenovo\.zcode\workspace\default` | 生成与查找的根 |
| `allowWrite` | `false` | 落盘门禁（默认只回显） |
| `order` | `790` | |

## 限制

- 生成的骨架带 TODO 占位（description/命令逻辑/README），落盘后需人工填再 build。
- 体检口径与 verify-plugin.mjs 对齐，但最终验收以 verify-plugin.mjs 为准。
