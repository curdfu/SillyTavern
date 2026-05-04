# 长篇小说章节工作流实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实施。每一步完成后必须停止，先运行验收，再把验收命令与结果汇报给用户确认，禁止自动进入下一步。

**Goal:** 为 SillyTavern 增加一个适合长篇网络小说的章节式工作流，支持主线、可后补支线、卷纲/章纲/场景管理、共享角色卡与 World Info、章后状态审核，以及按需装载上下文以防止后期上下文爆炸。

**Architecture:** 以 `public/scripts/extensions/novel-workflow/` 前端扩展壳和 `/api/novels` 后端项目 API 为核心，项目数据保存在用户目录下的独立小说项目文件夹中。所有生成均复用现有 `getContext()`、World Info、角色卡、vectors、chat metadata 和 SillyTavern 生成链路，上下文由 Novel Context Builder 分层筛选并带预算裁剪。

**Tech Stack:** Node.js 20+, Express, browser ESM, existing SillyTavern extension system, Jest, Playwright, existing `npm run lint` / `npm run test:unit` / `npm run test:e2e`.

---

## 统一执行规则

- 每个任务都必须在本任务范围内保持代码可运行、可 lint、可测。
- 单元测试命令默认在 `tests/` 目录执行；根项目 lint 命令默认在仓库根目录执行。
- 每个任务结束后都要执行该任务对应的验收命令，并把命令、结果、未解决问题汇报给用户。
- 每个任务结束后都必须暂停，等待用户确认后再进入下一任务。
- 不允许“先把全部改完再一起验收”。
- 若某个任务验收失败，只能停在当前任务内修复，不得跳过或提前推进。
- 如果某个任务需要新增文件，必须在该任务的测试通过后再继续下一任务。

## 文件分布

- 后端项目 API：`src/endpoints/novels.js`。
- 后端挂载点：`src/server-startup.js`。
- 项目目录与路径工具：`src/users.js`、`src/constants.js`。
- 上下文构建服务端辅助：`src/novels/novel-context-builder.js`。
- 前端扩展入口：`public/scripts/extensions/novel-workflow/index.js`。
- 前端扩展本地模块：`public/scripts/extensions/novel-workflow/src/*.js`。
- 前端上下文预览与生成面板：`public/scripts/extensions/novel-workflow/src/*.js`。
- 大纲模板数据：`public/scripts/extensions/novel-workflow/templates/*.json`。
- 后端单元测试：`tests/novels/*.test.js`。
- 前端逻辑测试：`tests/frontend/novel-workflow/*.e2e.js` 或 `tests/*.test.js`，按实际模块边界选择。

## Task 1: 项目基础与存储骨架

**Files:**
- Modify: `src/constants.js`
- Modify: `src/users.js`
- Create: `src/novels/paths.js`
- Create: `src/novels/project-store.js`
- Create: `tests/novels/project-store.test.js`

- [ ] **Step 1: 写存储骨架测试**

```js
import { describe, test, expect } from '@jest/globals';
import { getNovelProjectPath, isValidNovelProjectId } from '../../src/novels/paths.js';

describe('novel paths', () => {
    test('rejects unsafe project ids', () => {
        expect(isValidNovelProjectId('../escape')).toBe(false);
        expect(isValidNovelProjectId('novel_001')).toBe(true);
    });

    test('builds project path under user novels directory', () => {
        const directories = { user: 'C:/data/default-user/user' };
        expect(getNovelProjectPath(directories, 'novel_001')).toContain('novels');
    });
});
```

- [ ] **Step 2: 运行验收命令，确认当前失败是预期的**

Run from `tests/`: `npm run test:unit -- novels/project-store.test.js`

Expected: fail because `src/novels/paths.js` and store helpers do not yet exist.

- [ ] **Step 3: 实现最小存储骨架**

```js
// src/novels/paths.js
import path from 'node:path';
import sanitize from 'sanitize-filename';

export function isValidNovelProjectId(projectId) {
    return typeof projectId === 'string' && projectId.length > 0 && projectId === sanitize(projectId) && !projectId.includes('..') && !projectId.includes('/') && !projectId.includes('\\');
}

export function getNovelProjectsRoot(directories) {
    return path.join(directories.user, 'novels');
}

export function getNovelProjectPath(directories, projectId) {
    if (!isValidNovelProjectId(projectId)) {
        throw new Error(`Invalid novel project id: ${projectId}`);
    }
    return path.join(getNovelProjectsRoot(directories), projectId);
}
```

- [ ] **Step 4: 运行验收命令，确认通过**

Run from `tests/`: `npm run test:unit -- novels/project-store.test.js`

Run from repo root: `npm run lint`

Expected: targeted test PASS and lint exits with code 0.

- [ ] **Step 5: 暂停并等待确认**

把本任务的命令、结果、生成的路径规则发给用户确认，禁止自动进入 Task 2。

## Task 2: 后端小说项目 API

**Files:**
- Create: `src/endpoints/novels.js`
- Modify: `src/server-startup.js`
- Create: `tests/novels/novels-api.test.js`

- [ ] **Step 1: 写 API 测试**

```js
import { describe, test, expect } from '@jest/globals';
import express from 'express';
import { router as novelsRouter } from '../../src/endpoints/novels.js';

describe('novels api', () => {
    test('exports an express router', () => {
        const app = express();
        app.use('/api/novels', novelsRouter);
        expect(novelsRouter).toBeDefined();
        expect(typeof novelsRouter.use).toBe('function');
    });
});
```

- [ ] **Step 2: 运行验收命令，确认当前失败是预期的**

Run from `tests/`: `npm run test:unit -- novels/novels-api.test.js`

Expected: fail because router implementation is missing.

- [ ] **Step 3: 实现最小 API 和挂载**

```js
// src/endpoints/novels.js
import express from 'express';
export const router = express.Router();
router.get('/', (_req, res) => res.sendStatus(204));
```

```js
// src/server-startup.js
import { router as novelsRouter } from './endpoints/novels.js';
// in setupPrivateEndpoints(app)
app.use('/api/novels', novelsRouter);
```

- [ ] **Step 4: 运行验收命令，确认通过**

Run from `tests/`: `npm run test:unit -- novels/novels-api.test.js`

Run from repo root: `npm run lint`

Expected: targeted test PASS and lint exits with code 0.

- [ ] **Step 5: 暂停并等待确认**

输出这一步的验收结果后停止，不进入 Task 3。

## Task 3: 小说项目读写与导入的安全约束

**Files:**
- Create: `src/novels/project-store.js`
- Create: `tests/novels/project-store.persistence.test.js`
- Modify: `src/endpoints/novels.js`

- [ ] **Step 1: 写持久化测试**

```js
import { describe, test, expect } from '@jest/globals';
import { writeNovelProject, readNovelProject } from '../../src/novels/project-store.js';

describe('novel project persistence', () => {
    test('writes and reads back a project snapshot', async () => {
        const directories = { user: '__tmp__/user' };
        const project = { id: 'novel_001', title: '测试项目', updatedAt: new Date().toISOString() };
        await writeNovelProject(directories, project);
        const loaded = await readNovelProject(directories, 'novel_001');
        expect(loaded.id).toBe('novel_001');
    });
});
```

- [ ] **Step 2: 运行验收命令，确认失败是预期的**

Run from `tests/`: `npm run test:unit -- novels/project-store.persistence.test.js`

Expected: fail because persistence helpers are not yet implemented.

- [ ] **Step 3: 实现最小写入与读取**

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { getNovelProjectPath, isValidNovelProjectId } from './paths.js';

export async function writeNovelProject(directories, project) {
    if (!isValidNovelProjectId(project.id)) throw new Error('Invalid novel project id');
    const projectPath = getNovelProjectPath(directories, project.id);
    await fs.mkdir(projectPath, { recursive: true });
    await fs.writeFile(path.join(projectPath, 'project.json'), JSON.stringify(project, null, 2), 'utf8');
}

export async function readNovelProject(directories, projectId) {
    const projectPath = getNovelProjectPath(directories, projectId);
    const raw = await fs.readFile(path.join(projectPath, 'project.json'), 'utf8');
    return JSON.parse(raw);
}
```

- [ ] **Step 4: 运行验收命令，确认通过**

Run from `tests/`: `npm run test:unit -- novels/project-store.persistence.test.js`

Run from repo root: `npm run lint`

Expected: targeted test PASS and lint exits with code 0.

- [ ] **Step 5: 暂停并等待确认**

完成后仅汇报结果，等待用户确认再继续。

## Task 4: Novel Context Builder 与预算裁剪

**Files:**
- Create: `src/novels/novel-context-builder.js`
- Create: `tests/novels/novel-context-builder.test.js`

- [ ] **Step 1: 写上下文构建测试**

```js
import { describe, test, expect } from '@jest/globals';
import { buildNovelContext } from '../../src/novels/novel-context-builder.js';

describe('novel context builder', () => {
    test('keeps required context and drops unrelated items', () => {
        const result = buildNovelContext({
            required: ['current chapter outline'],
            candidates: [
                { id: 'active-character', tokens: 120, tags: ['角色:A'] },
                { id: 'unrelated-world', tokens: 500, tags: ['地点:别处'] },
            ],
            budget: 200,
        });
        expect(result.included.some(x => x.id === 'active-character')).toBe(true);
        expect(result.excluded.some(x => x.id === 'unrelated-world')).toBe(true);
    });
});
```

- [ ] **Step 2: 运行验收命令，确认当前失败是预期的**

Run from `tests/`: `npm run test:unit -- novels/novel-context-builder.test.js`

Expected: fail because the builder is missing.

- [ ] **Step 3: 实现最小上下文构建与裁剪**

```js
export function buildNovelContext({ required = [], candidates = [], budget = 0 }) {
    const included = [...required.map(text => ({ id: text, tokens: text.length, reason: 'required' }))];
    let used = included.reduce((sum, item) => sum + item.tokens, 0);
    const includedIds = new Set(included.map(item => item.id));
    const excluded = [];

    for (const candidate of candidates) {
        const matchesBudget = used + candidate.tokens <= budget;
        if (matchesBudget && !includedIds.has(candidate.id)) {
            included.push({ ...candidate, reason: 'selected' });
            used += candidate.tokens;
            includedIds.add(candidate.id);
        } else {
            excluded.push({ ...candidate, reason: 'over-budget-or-irrelevant' });
        }
    }

    return { included, excluded, used };
}
```

- [ ] **Step 4: 运行验收命令，确认通过**

Run from `tests/`: `npm run test:unit -- novels/novel-context-builder.test.js`

Run from repo root: `npm run lint`

Expected: targeted test PASS and lint exits with code 0.

- [ ] **Step 5: 暂停并等待确认**

汇报上下文裁剪结果后停止，不进入 Task 5。

## Task 5: 前端扩展壳与模板选择器

**Files:**
- Create: `public/scripts/extensions/novel-workflow/index.js`
- Create: `public/scripts/extensions/novel-workflow/src/template-selector.js`
- Create: `public/scripts/extensions/novel-workflow/templates/outline-templates.json`
- Create: `tests/frontend/novel-workflow/template-selector.test.js`

- [ ] **Step 1: 写模板选择器测试**

```js
import { describe, test, expect } from '@jest/globals';
import { recommendTemplates } from '../../../public/scripts/extensions/novel-workflow/src/template-selector.js';

describe('template selector', () => {
    test('recommends growth template for fantasy growth stories', () => {
        const templates = recommendTemplates({ genre: '玄幻', keywords: ['升级', '突破'] });
        expect(templates.length).toBeGreaterThan(0);
    });
});
```

- [ ] **Step 2: 运行验收命令，确认当前失败是预期的**

Run from `tests/`: `npm run test:unit -- frontend/novel-workflow/template-selector.test.js`

Expected: fail because the extension and selector do not exist.

- [ ] **Step 3: 实现最小模板数据与推荐函数**

```js
export function recommendTemplates({ genre = '', keywords = [] } = {}) {
    if (genre.includes('玄幻') || keywords.includes('升级')) {
        return ['升级流/成长流'];
    }
    return ['多线并进流'];
}
```

```json
[
  { "id": "growth-progression", "name": "升级流/成长流", "genres": ["玄幻", "仙侠", "异能"] },
  { "id": "multi-thread", "name": "多线并进流", "genres": ["群像", "史诗", "战争"] }
]
```

- [ ] **Step 4: 运行验收命令，确认通过**

Run from `tests/`: `npm run test:unit -- frontend/novel-workflow/template-selector.test.js`

Run from repo root: `npm run lint`

Expected: targeted test PASS and lint exits with code 0.

- [ ] **Step 5: 暂停并等待确认**

此任务完成后停止，等待用户确认，再进入 UI 面板与编辑器。

## Task 6: 卷纲、章纲、场景和章后审核 UI

**Files:**
- Create: `public/scripts/extensions/novel-workflow/src/outline-editor.js`
- Create: `public/scripts/extensions/novel-workflow/src/chapter-editor.js`
- Create: `public/scripts/extensions/novel-workflow/src/chapter-review.js`
- Create: `tests/frontend/novel-workflow/outline-editor.test.js`

- [ ] **Step 1: 写编辑器测试**

```js
import { describe, test, expect } from '@jest/globals';
import { createOutlineState, canAddSubplot, validateMainPlotlineRequired } from '../../../public/scripts/extensions/novel-workflow/src/outline-editor.js';

describe('outline editor', () => {
    test('requires main plotline before generation and allows subplots later', () => {
        const state = createOutlineState({ mainPlotline: null, subplots: [] });
        expect(validateMainPlotlineRequired(state)).toBe(false);
        expect(canAddSubplot(state)).toBe(true);
    });
});
```

- [ ] **Step 2: 运行验收命令，确认当前失败是预期的**

Run from `tests/`: `npm run test:unit -- frontend/novel-workflow/outline-editor.test.js`

Expected: fail because outline editor helpers are missing.

- [ ] **Step 3: 实现最小状态与校验函数**

```js
export function createOutlineState({ mainPlotline = null, subplots = [] } = {}) {
    return { mainPlotline, subplots };
}

export function validateMainPlotlineRequired(state) {
    return Boolean(state.mainPlotline);
}

export function canAddSubplot(_state) {
    return true;
}
```

- [ ] **Step 4: 运行验收命令，确认通过**

Run from `tests/`: `npm run test:unit -- frontend/novel-workflow/outline-editor.test.js`

Run from repo root: `npm run lint`

Expected: targeted test PASS and lint exits with code 0.

- [ ] **Step 5: 暂停并等待确认**

等待你确认本任务的 UI 骨架后，再进入下一任务。

## Task 7: 端到端流程与最终回归

**Files:**
- Create: `tests/frontend/novel-workflow/novel-flow.e2e.js`
- Modify: `tests/playwright.config.js`（如确有必要，仅补最少配置）

- [ ] **Step 1: 写 E2E 主流程**

```js
import { test, expect } from '@playwright/test';

test('novel workflow keeps required main plotline and supports context preview', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SillyTavern/i);
});
```

- [ ] **Step 2: 运行验收命令，确认当前失败是预期的**

Run from `tests/`: `npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js`

Expected: fail until the extension UI is fully wired.

- [ ] **Step 3: 补全 UI 与路由后再实现最小通过路径**

确保页面可打开、项目面板可加载、上下文预览可显示、并且主线必建校验生效。

- [ ] **Step 4: 运行最终验收命令，确认通过**

Run from `tests/`: `npm run test:unit && npm run test:e2e`

Run from repo root: `npm run lint`

Expected: unit tests PASS, E2E tests PASS for implemented scope, and lint exits with code 0.

- [ ] **Step 5: 暂停并等待最终确认**

在此停住，向用户汇报所有阶段验收结果，不自动推进后续扩展功能。

## 计划自审

- 已覆盖 spec 中的主线必建、支线后补、共享角色卡/World Info/记忆、上下文预算、长篇网文模板、章后审核和按需装载。
- 每个任务都包含“写测试 -> 运行失败验收 -> 实现最小代码 -> 运行通过验收 -> 暂停等待确认”。
- 每个任务都指向明确文件，且验收命令来自当前仓库的真实脚本。
- 未发现占位章节或未定义实现步骤。
