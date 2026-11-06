# dsh-plugin-plugin-forge

> **dsh 插件家族**：23 个插件同一目录 **[dsh-plugin-family](https://github.com/121212165/dsh-plugin-family)**。

**EN** — Scaffold and static validator for dsh plugins. Generates a 10-file source/configuration skeleton and reports missing files or metadata. `/forge new` and `forge_new` show a file manifest without writing. Writing requires both `/forge new!` and `allowWrite=true`; generated projects still need review, dependency setup, build and independent verification.

**中文** —— 插件脚手架：给一个 short 名（如 `my-tool`），生成 10 文件源码与配置骨架；普通命令和工具只回显文件清单，不落盘。仅 `/forge new!` 且 `allowWrite=true` 时写盘。`/forge check` 静态检查文件、字段、scripts、engines 和 lib 入口，不能替代真实构建或最终验收。

## 功能与用法

- `/forge new <short> [描述]`：生成骨架，回显文件名与内容长度清单，不展示完整文件正文。
- `/forge new! <short> [描述]`：请求写盘，仍需配置 `allowWrite=true`；否则拒写并回显清单。
- `/forge check <short|Windows 盘符绝对路径>`：体检并报告缺项；请显式传入目标。
- `/forge list`：列出 workspace 中名称以 `dsh-plugin-` 开头的条目，不验证其是否为插件目录。
- `forge_new` 工具：接收 `short`、`description`，始终只回显清单，即使 `allowWrite=true` 也不落盘。
- `forge_check` 工具：接收 `dir`，支持 short 名或 Windows 盘符绝对路径。
- 导出的 `forgeFiles(input)` 返回各文件的 `path` 与 `content`，供代码调用；未注册 `forge_files` 工具。
- short 名会清洗为小写连字符形式、去除 `dsh-plugin-` 前缀；需字母开头且不超过 40 字符。

## 骨架内容

- `package.json`、`tsconfig.json`、`tsconfig.build.json`：包元数据、脚本和编译配置。
- `cordis.patch.yml`、`README.md`、`.gitignore`、`LICENSE`：接入配置与配套文件。
- `src/plugin.ts`、`src/index.ts`、`test/<short 下划线形式>.test.ts`：命令 / 工具装配与 mock 测试。
- 以上共 10 个文件，不包含 `lib/` 编译产物或 `icon.svg`。

## 本插件源码安装与接入

1. 使用 Node.js `>=22.18`；本包是 ESM，宿主需提供 Cordis `>=4.0.0`。
2. 在本仓目录运行 `npm install`，安装开发依赖；`prepare` 自动执行构建。
3. 运行 `npm run check`，依次执行类型检查、Node 测试和 TypeScript 构建。
4. 将本包加入 dsh/Cordis 宿主可解析的插件依赖，按宿主的 patch 加载方式接入 `cordis.patch.yml`。
5. patch 注册名为 `dsh-plugin-plugin-forge`，宿主须先提供 `commands` 与 `tools` 服务。
6. 入口为 `lib/index.js`，类型入口为 `lib/types/index.d.ts`；按实际环境设置 `workspaceRoot`，保持默认禁止写盘。

以上步骤针对 forge 本插件，不代表生成的新插件无需修订即可构建。

## 配置

| 字段 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 为 false 时不注册命令和工具 |
| `workspaceRoot` | `C:\Users\lenovo\.zcode\workspace\default` | 生成与查找的根，需按实际环境修改 |
| `allowWrite` | `false` | 仅允许 `new!` 分支写盘，不会令普通命令或工具自动写盘 |
| `order` | `790` | 当前用于挂载日志，未用于注册排序 |

## 验证状态

- 本次维护在 Windows / Node.js v25.7.0 运行 `npm run check` 通过：类型检查、10/10 测试与构建均通过。
- 测试涉及名称清洗、10 文件模板、静态缺项、mock 命令 / 工具与拒写门禁。
- 模板测试仅检查内容与缺项，未实际安装并编译生成项目，也未调用外部 `verify-plugin.mjs`。
- 仓内 dist-guard 配置为 Ubuntu / Node 25，本次未运行或核验实际 Linux CI。
- 未验证真实 dsh 宿主安装、UI 点击、工具卡片或成功写盘流程；mock 装配不等于 UI 验收。

## 已知边界

- 路径拼接使用反斜杠，绝对路径识别仅支持 Windows 盘符；POSIX、UNC 路径不受完整支持，含空格的命令路径也会被拆分。
- 写盘会覆盖目标目录中的同名文件，没有冲突确认或事务回滚；只应在确认无重要文件的新目录使用。
- 生成模板仍有 TODO；依赖、编译选项、脚本与图标需人工检查，不能承诺“生成即过检”。
- 模板引用了 `@deepseek-ai/dsh-tools`，但其生成的依赖清单未包含该包；声明的 `icon.svg` 也未生成。
- 模板 `check` 脚本含 Windows 风格重定向与 `&`，不是可靠的跨平台串行验证链。
- 静态校验只检查 `test/` 是否存在、`lib/index.js` 是否存在，不执行测试、不校验产物与源码一致性。
- 校验器仍要求 `start` 脚本和 `engines.pnpm` 等旧口径，可能对当前仓配置报缺项；最终需按目标规范独立验收。
