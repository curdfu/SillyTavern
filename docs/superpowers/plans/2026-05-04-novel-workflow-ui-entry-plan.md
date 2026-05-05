# 长篇小说工作流 UI 入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实施。步骤使用 checkbox（`- [ ]`）跟踪。执行时必须遵守本仓库约束：不执行 git 操作；每个任务验收后停止，由用户自行决定是否提交。

**Goal:** 在 SillyTavern 中实现独立的 Novel Workflow 工作台入口和页面骨架，支持完全从 0 创建小说，同时保留从当前聊天、角色卡、World Info、memory 和 vectors 导入素材的可选路径。

**Architecture:** 以 `public/scripts/extensions/novel-workflow/` 为独立扩展工作台，使用扩展魔杖菜单作为全局入口，工作台内部通过局部状态和 `/api/novels` API 管理项目。当前聊天不是主路径依赖，只作为导入素材源；空白小说项目必须能在无聊天、无角色卡、无 World Info 的状态下创建、打开和编辑。

**Tech Stack:** SillyTavern browser ESM extension、jQuery、existing extension menu、`getContext()`、`/api/novels`、`src/novels/*`、Jest、Playwright、root `npm run lint`、`tests/` 下 `npm run test:unit` / `npm run test:e2e`。

---

## 执行规则

- 不执行任何 git 命令。每个任务结束后只提示用户自行提交。
- 每个任务必须先写测试，再实现，再运行验收。
- 每个任务结束后停止，汇报命令和结果，等待用户确认再进入下一任务。
- 当前聊天、角色卡、World Info、memory、vectors 只能作为可选素材源，不能成为新建或打开小说项目的前提。
- 不自动写回源角色卡或源 World Info。
- 写作页和项目页必须在没有当前聊天时仍可打开。
- UI 必须符合 SillyTavern 现有工具型界面风格，避免独立营销页或大 hero 页面。

## 文件分布

- Modify: `public/scripts/extensions/novel-workflow/index.js`  
  扩展初始化、菜单入口、工作台挂载、事件绑定。

- Create: `public/scripts/extensions/novel-workflow/workbench.html`  
  工作台 DOM 模板。

- Create: `public/scripts/extensions/novel-workflow/style.css`  
  工作台布局和响应式样式。

- Modify: `public/scripts/extensions/novel-workflow/manifest.json`  
  引入 CSS。

- Create: `public/scripts/extensions/novel-workflow/src/workbench-state.js`  
  工作台当前页面、当前项目、项目列表和表单状态。

- Create: `public/scripts/extensions/novel-workflow/src/project-model.js`  
  空白小说项目模型、项目 ID 校验、主线校验、默认字段。

- Create: `public/scripts/extensions/novel-workflow/src/project-client.js`  
  `/api/novels` 前端客户端。

- Create: `public/scripts/extensions/novel-workflow/src/project-pages.js`  
  “我的小说”“新建小说”“项目总览”页面渲染和事件。

- Create: `public/scripts/extensions/novel-workflow/src/worldbuilding-state.js`  
  项目内设定库、角色库、世界观的本地状态 helper。

- Create: `public/scripts/extensions/novel-workflow/src/worldbuilding-pages.js`  
  设定库、角色库、世界观页面渲染和事件。

- Modify: `public/scripts/extensions/novel-workflow/src/outline-editor.js`  
  扩展主线、支线、卷纲、章纲、场景 helper。

- Create: `public/scripts/extensions/novel-workflow/src/outline-pages.js`  
  主线/支线、模板与节奏、卷纲/章纲、场景页面。

- Create: `public/scripts/extensions/novel-workflow/src/context-preview.js`  
  上下文预览 UI 状态转换。

- Create: `public/scripts/extensions/novel-workflow/src/writing-pages.js`  
  写作页和章后审核页。

- Modify: `src/endpoints/novels.js`  
  从健康检查扩展为最小项目 CRUD API。

- Modify: `src/novels/project-store.js`  
  增加项目列表、删除前校验、基础目录初始化。

- Test: `tests/novels/novels-api.test.js`  
  后端项目 API 测试。

- Test: `tests/frontend/novel-workflow/project-model.test.js`  
  空白项目模型和校验测试。

- Test: `tests/frontend/novel-workflow/workbench-state.test.js`  
  工作台导航和状态测试。

- Test: `tests/frontend/novel-workflow/worldbuilding-state.test.js`  
  本地设定、角色、世界观状态测试。

- Test: `tests/frontend/novel-workflow/context-preview.test.js`  
  included/excluded/used UI 转换测试。

- Test: `tests/frontend/novel-workflow/novel-flow.e2e.js`  
  E2E 覆盖入口打开、空白小说创建、无聊天可用路径。

## Task 1: 后端最小项目 CRUD API

**Files:**
- Modify: `src/endpoints/novels.js`
- Modify: `src/novels/project-store.js`
- Test: `tests/novels/novels-api.test.js`

- [ ] **Step 1: 扩展 API 测试**

在 `tests/novels/novels-api.test.js` 增加以下测试，保留现有 router 导出测试。

```js
test('creates, lists, and reads a blank novel project', async () => {
    const directories = await createTempDirectories();
    const app = express();
    app.use(express.json());
    app.use((request, _response, next) => {
        request.user = { directories };
        next();
    });
    app.use('/api/novels', novelsRouter);

    const project = {
        id: 'novel_blank_001',
        title: 'Blank Novel',
        genre: 'Fantasy',
        synopsis: '',
        mainPlotline: 'Find the lost city',
    };

    const createResponse = await request(app).post('/api/novels/projects').send(project);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.id).toBe('novel_blank_001');

    const listResponse = await request(app).get('/api/novels/projects');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.projects).toHaveLength(1);

    const readResponse = await request(app).get('/api/novels/projects/novel_blank_001');
    expect(readResponse.status).toBe(200);
    expect(readResponse.body.title).toBe('Blank Novel');
});

test('rejects blank project creation without a main plotline', async () => {
    const directories = await createTempDirectories();
    const app = express();
    app.use(express.json());
    app.use((request, _response, next) => {
        request.user = { directories };
        next();
    });
    app.use('/api/novels', novelsRouter);

    const response = await request(app).post('/api/novels/projects').send({
        id: 'novel_blank_002',
        title: 'Invalid Novel',
        mainPlotline: '',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('main plotline');
});
```

如果当前测试环境没有 `supertest`，不要新增依赖。改用 `node:http` 启动本地 Express server 或拆出 handler 直接测试。不得修改 `package.json`。

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:unit -- novels/novels-api.test.js
```

Expected: FAIL，原因是 `/api/novels/projects` 尚未实现。

- [ ] **Step 3: 实现项目列表和写入 API**

在 `src/novels/project-store.js` 增加：

```js
export async function listNovelProjects(directories) {
    const root = getNovelProjectsRoot(directories);
    let entries = [];

    try {
        entries = await fs.readdir(root, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }

    const projects = [];
    for (const entry of entries) {
        if (!entry.isDirectory() || !isValidNovelProjectId(entry.name)) {
            continue;
        }

        try {
            projects.push(await readNovelProject(directories, entry.name));
        } catch {
            continue;
        }
    }

    return projects.sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export function normalizeNovelProject(project) {
    const now = new Date().toISOString();
    return {
        id: project.id,
        title: String(project.title || '').trim(),
        genre: String(project.genre || '').trim(),
        synopsis: String(project.synopsis || '').trim(),
        mainPlotline: String(project.mainPlotline || '').trim(),
        current: project.current || { volumeId: null, chapterId: null, sceneId: null },
        sources: project.sources || { chat: null, characters: [], worlds: [], memoryCollections: [], vectorCollections: [] },
        localLibrary: project.localLibrary || { settings: [], characters: [], lore: [] },
        createdAt: project.createdAt || now,
        updatedAt: now,
    };
}
```

在 `src/endpoints/novels.js` 增加：

```js
import { listNovelProjects, normalizeNovelProject, readNovelProject, writeNovelProject } from '../novels/project-store.js';

router.get('/projects', async (request, response) => {
    const projects = await listNovelProjects(request.user.directories);
    response.json({ projects });
});

router.post('/projects', async (request, response) => {
    const project = normalizeNovelProject(request.body);
    if (!project.title) {
        return response.status(400).json({ error: 'Novel title is required' });
    }
    if (!project.mainPlotline) {
        return response.status(400).json({ error: 'Novel main plotline is required' });
    }

    await writeNovelProject(request.user.directories, project);
    return response.status(201).json(project);
});

router.get('/projects/:projectId', async (request, response) => {
    const project = await readNovelProject(request.user.directories, request.params.projectId);
    response.json(project);
});
```

如果项目 ID 无效，返回 `400`；如果项目不存在，返回 `404`，不要把内部路径暴露给前端。

- [ ] **Step 4: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- novels/novels-api.test.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted test PASS，lint PASS。

- [ ] **Step 5: 停止并汇报**

汇报命令、结果、API 路径和未解决问题。提示用户自行提交，不执行 git。

## Task 2: 空白小说项目模型

**Files:**
- Create: `public/scripts/extensions/novel-workflow/src/project-model.js`
- Test: `tests/frontend/novel-workflow/project-model.test.js`

- [ ] **Step 1: 写项目模型测试**

创建 `tests/frontend/novel-workflow/project-model.test.js`：

```js
import { describe, expect, test } from '@jest/globals';

import {
    createBlankNovelProject,
    validateBlankNovelProject,
    createProjectIdFromTitle,
} from '../../../public/scripts/extensions/novel-workflow/src/project-model.js';

describe('novel workflow project model', () => {
    test('creates a blank project without chat, character cards, or world info', () => {
        const project = createBlankNovelProject({
            title: 'Lost City',
            genre: 'Fantasy',
            mainPlotline: 'Find the lost city',
        });

        expect(project.title).toBe('Lost City');
        expect(project.sources.chat).toBeNull();
        expect(project.sources.characters).toEqual([]);
        expect(project.sources.worlds).toEqual([]);
        expect(project.localLibrary.characters).toEqual([]);
        expect(project.mainPlotline).toBe('Find the lost city');
    });

    test('rejects blank projects without a title or main plotline', () => {
        expect(validateBlankNovelProject({ title: '', mainPlotline: 'Goal' }).valid).toBe(false);
        expect(validateBlankNovelProject({ title: 'Title', mainPlotline: '' }).valid).toBe(false);
    });

    test('generates a safe project id from title', () => {
        expect(createProjectIdFromTitle('Lost City!')).toMatch(/^lost-city-/);
    });
});
```

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/project-model.test.js
```

Expected: FAIL，原因是 `project-model.js` 不存在。

- [ ] **Step 3: 实现项目模型**

创建 `public/scripts/extensions/novel-workflow/src/project-model.js`：

```js
export function createProjectIdFromTitle(title) {
    const slug = String(title || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'novel';

    return `${slug}-${Date.now().toString(36)}`;
}

export function validateBlankNovelProject({ title = '', id = '', mainPlotline = '' } = {}) {
    const errors = [];
    if (!String(title).trim()) {
        errors.push('title is required');
    }
    if (!String(mainPlotline).trim()) {
        errors.push('main plotline is required');
    }
    if (id && /[\\\/]|\.\./.test(id)) {
        errors.push('project id is invalid');
    }

    return { valid: errors.length === 0, errors };
}

export function createBlankNovelProject({ id, title, genre = '', synopsis = '', mainPlotline, initialGoal = '' } = {}) {
    const projectId = id || createProjectIdFromTitle(title);
    const now = new Date().toISOString();

    return {
        id: projectId,
        title: String(title || '').trim(),
        genre: String(genre || '').trim(),
        synopsis: String(synopsis || '').trim(),
        mainPlotline: String(mainPlotline || '').trim(),
        initialGoal: String(initialGoal || '').trim(),
        current: { volumeId: null, chapterId: null, sceneId: null },
        sources: {
            chat: null,
            characters: [],
            worlds: [],
            memoryCollections: [],
            vectorCollections: [],
        },
        localLibrary: {
            settings: [],
            characters: [],
            lore: [],
        },
        outlines: {
            volumes: [],
            chapters: [],
            scenes: [],
        },
        reviews: [],
        createdAt: now,
        updatedAt: now,
    };
}
```

- [ ] **Step 4: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/project-model.test.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted test PASS，lint PASS。

- [ ] **Step 5: 停止并汇报**

汇报模型字段和校验结果。提示用户自行提交，不执行 git。

## Task 3: 工作台状态与导航

**Files:**
- Create: `public/scripts/extensions/novel-workflow/src/workbench-state.js`
- Test: `tests/frontend/novel-workflow/workbench-state.test.js`

- [ ] **Step 1: 写状态测试**

创建 `tests/frontend/novel-workflow/workbench-state.test.js`：

```js
import { describe, expect, test } from '@jest/globals';

import {
    createWorkbenchState,
    selectWorkbenchPage,
    setActiveProject,
} from '../../../public/scripts/extensions/novel-workflow/src/workbench-state.js';

describe('novel workflow workbench state', () => {
    test('starts on projects page without requiring a chat', () => {
        const state = createWorkbenchState();

        expect(state.activePage).toBe('projects');
        expect(state.activeProject).toBeNull();
        expect(state.chatLinked).toBe(false);
    });

    test('navigates to pages and stores active project', () => {
        const state = setActiveProject(createWorkbenchState(), { id: 'novel_001', title: 'Novel' });
        const next = selectWorkbenchPage(state, 'worldbuilding');

        expect(next.activePage).toBe('worldbuilding');
        expect(next.activeProject.id).toBe('novel_001');
    });
});
```

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/workbench-state.test.js
```

Expected: FAIL，原因是 `workbench-state.js` 不存在。

- [ ] **Step 3: 实现状态 helper**

创建 `public/scripts/extensions/novel-workflow/src/workbench-state.js`：

```js
const PAGES = new Set([
    'projects',
    'new',
    'overview',
    'worldbuilding',
    'characters',
    'lore',
    'plotlines',
    'templates',
    'outlines',
    'scenes',
    'context',
    'writing',
    'review',
]);

export function createWorkbenchState() {
    return {
        activePage: 'projects',
        activeProject: null,
        projects: [],
        chatLinked: false,
        error: null,
    };
}

export function selectWorkbenchPage(state, page) {
    if (!PAGES.has(page)) {
        return { ...state, error: `Unknown novel workflow page: ${page}` };
    }

    return { ...state, activePage: page, error: null };
}

export function setActiveProject(state, project) {
    return {
        ...state,
        activeProject: project,
        activePage: project ? 'overview' : 'projects',
        chatLinked: Boolean(project?.sources?.chat),
    };
}
```

- [ ] **Step 4: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/workbench-state.test.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted test PASS，lint PASS。

- [ ] **Step 5: 停止并汇报**

汇报页面枚举和无聊天初始状态。提示用户自行提交，不执行 git。

## Task 4: 工作台入口和基础页面 DOM

**Files:**
- Modify: `public/scripts/extensions/novel-workflow/index.js`
- Modify: `public/scripts/extensions/novel-workflow/manifest.json`
- Create: `public/scripts/extensions/novel-workflow/workbench.html`
- Create: `public/scripts/extensions/novel-workflow/style.css`
- Create: `public/scripts/extensions/novel-workflow/src/project-client.js`
- Create: `public/scripts/extensions/novel-workflow/src/project-pages.js`
- Test: `tests/frontend/novel-workflow/novel-flow.e2e.js`

⚠️ 此任务未来执行会修改 6 个文件，属于中风险 UI 接线任务。执行前向用户确认进入本任务。

- [ ] **Step 1: 扩展 E2E 测试**

修改 `tests/frontend/novel-workflow/novel-flow.e2e.js`：

```js
import { test, expect } from '@playwright/test';

test('novel workflow opens as an independent workbench', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SillyTavern/i);

    await page.locator('#extensionsMenuButton').click();
    await page.getByRole('button', { name: /Novel Workflow/i }).click();

    await expect(page.locator('#novel_workflow_workbench')).toBeVisible();
    await expect(page.getByRole('heading', { name: /My Novels/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Blank Novel/i })).toBeVisible();
});
```

- [ ] **Step 2: 运行失败验收**

确保服务可达后，Run from `tests/`:

```powershell
npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js
```

Expected: FAIL，原因是 Novel Workflow 菜单入口和工作台 DOM 尚未实现。

- [ ] **Step 3: 添加模板和样式**

创建 `public/scripts/extensions/novel-workflow/workbench.html`：

```html
<section id="novel_workflow_workbench" class="novel-workflow hidden">
    <header class="novel-workflow__header">
        <h3>My Novels</h3>
        <div class="novel-workflow__actions">
            <button type="button" class="menu_button" data-novel-page="projects">Projects</button>
            <button type="button" class="menu_button" data-novel-page="new">New</button>
        </div>
    </header>
    <nav class="novel-workflow__nav" aria-label="Novel workflow pages"></nav>
    <main class="novel-workflow__body" data-novel-body></main>
</section>
```

创建 `public/scripts/extensions/novel-workflow/style.css`：

```css
.novel-workflow {
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 0.75rem;
    min-height: 360px;
}

.novel-workflow.hidden {
    display: none;
}

.novel-workflow__header,
.novel-workflow__actions,
.novel-workflow__nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.novel-workflow__header {
    justify-content: space-between;
}

.novel-workflow__body {
    overflow: auto;
}

.novel-workflow__form {
    display: grid;
    gap: 0.5rem;
}
```

在 `manifest.json` 增加：

```json
"css": "style.css"
```

- [ ] **Step 4: 添加入口和项目页渲染**

在 `index.js` 中：

```js
import { renderExtensionTemplateAsync } from '../../extensions.js';
import { createWorkbenchState, selectWorkbenchPage } from './src/workbench-state.js';
import { renderProjectsPage, renderNewProjectPage } from './src/project-pages.js';

const MODULE_NAME = 'novel-workflow';
let state = createWorkbenchState();

async function ensureWorkbench() {
    if (document.querySelector('#novel_workflow_workbench')) {
        return document.querySelector('#novel_workflow_workbench');
    }

    const html = await renderExtensionTemplateAsync(MODULE_NAME, 'workbench');
    document.body.insertAdjacentHTML('beforeend', html);
    return document.querySelector('#novel_workflow_workbench');
}

function renderWorkbench() {
    const body = document.querySelector('[data-novel-body]');
    if (!body) {
        return;
    }

    if (state.activePage === 'new') {
        renderNewProjectPage(body);
        return;
    }

    renderProjectsPage(body, state);
}

async function openWorkbench() {
    const workbench = await ensureWorkbench();
    workbench.classList.remove('hidden');
    renderWorkbench();
}

function registerMenuEntry() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu_button';
    button.textContent = 'Novel Workflow';
    button.addEventListener('click', openWorkbench);
    document.querySelector('#extensionsMenu')?.append(button);
}

jQuery(async () => {
    registerMenuEntry();
    document.addEventListener('click', event => {
        const page = event.target?.dataset?.novelPage;
        if (!page) {
            return;
        }
        state = selectWorkbenchPage(state, page);
        renderWorkbench();
    });
});

export { MODULE_NAME };
```

创建 `project-pages.js`：

```js
export function renderProjectsPage(container, state) {
    container.replaceChildren();
    const title = document.createElement('h4');
    title.textContent = 'My Novels';

    const empty = document.createElement('p');
    empty.textContent = state.projects.length === 0 ? 'No novel projects yet.' : '';

    const newButton = document.createElement('button');
    newButton.type = 'button';
    newButton.className = 'menu_button';
    newButton.dataset.novelPage = 'new';
    newButton.textContent = 'Blank Novel';

    container.append(title, empty, newButton);
}

export function renderNewProjectPage(container) {
    container.replaceChildren();
    const title = document.createElement('h4');
    title.textContent = 'New Novel';

    const form = document.createElement('form');
    form.className = 'novel-workflow__form';
    form.innerHTML = `
        <label>Title <input class="text_pole" name="title" required></label>
        <label>Genre <input class="text_pole" name="genre"></label>
        <label>Main plotline <textarea class="text_pole" name="mainPlotline" required></textarea></label>
        <button type="submit" class="menu_button">Create Blank Novel</button>
    `;

    container.append(title, form);
}
```

- [ ] **Step 5: 运行通过验收**

Run from repo root:

```powershell
npm run lint
```

确保服务可达后，Run from `tests/`:

```powershell
npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js
```

Expected: lint PASS，targeted E2E PASS。

- [ ] **Step 6: 停止并汇报**

汇报入口位置、工作台 DOM、E2E 结果。提示用户自行提交，不执行 git。

## Task 5: 新建空白小说表单接入 API

**Files:**
- Modify: `public/scripts/extensions/novel-workflow/src/project-client.js`
- Modify: `public/scripts/extensions/novel-workflow/src/project-pages.js`
- Modify: `public/scripts/extensions/novel-workflow/index.js`
- Test: `tests/frontend/novel-workflow/project-model.test.js`
- Test: `tests/frontend/novel-workflow/novel-flow.e2e.js`

- [ ] **Step 1: 扩展 E2E 创建测试**

在 `novel-flow.e2e.js` 增加：

```js
test('creates a blank novel without current chat assets', async ({ page }) => {
    await page.goto('/');
    await page.locator('#extensionsMenuButton').click();
    await page.getByRole('button', { name: /Novel Workflow/i }).click();
    await page.getByRole('button', { name: /Blank Novel/i }).click();

    await page.getByLabel(/Title/i).fill('Zero Start Novel');
    await page.getByLabel(/Genre/i).fill('Fantasy');
    await page.getByLabel(/Main plotline/i).fill('A nobody builds a kingdom from nothing');
    await page.getByRole('button', { name: /Create Blank Novel/i }).click();

    await expect(page.getByRole('heading', { name: /Zero Start Novel/i })).toBeVisible();
    await expect(page.getByText(/No chat linked/i)).toBeVisible();
});
```

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js
```

Expected: FAIL，原因是表单尚未提交 API、没有项目总览渲染。

- [ ] **Step 3: 实现 API client**

创建或修改 `project-client.js`：

```js
export async function listNovelProjects() {
    const response = await fetch('/api/novels/projects');
    if (!response.ok) {
        throw new Error(`Failed to list novel projects: ${response.status}`);
    }
    return response.json();
}

export async function createNovelProject(project) {
    const response = await fetch('/api/novels/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `Failed to create novel project: ${response.status}`);
    }

    return response.json();
}
```

- [ ] **Step 4: 接入表单提交**

在 `project-pages.js` 让 `renderNewProjectPage(container, { onCreate })` 接收回调，表单提交时使用 `createBlankNovelProject()` 生成项目。  
在 `index.js` 中调用 `createNovelProject(project)`，成功后 `setActiveProject()` 并渲染项目总览。

项目总览至少显示：

- 项目标题。
- `No chat linked`。
- 主线文本。
- 空本地角色数。
- 空 World Info 绑定数。

- [ ] **Step 5: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/project-model.test.js
npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted unit PASS，targeted E2E PASS，lint PASS。

- [ ] **Step 6: 停止并汇报**

汇报空白创建流程和无聊天状态。提示用户自行提交，不执行 git。

## Task 6: 项目内设定库、角色库、世界观状态

**Files:**
- Create: `public/scripts/extensions/novel-workflow/src/worldbuilding-state.js`
- Create: `public/scripts/extensions/novel-workflow/src/worldbuilding-pages.js`
- Modify: `public/scripts/extensions/novel-workflow/index.js`
- Test: `tests/frontend/novel-workflow/worldbuilding-state.test.js`

- [ ] **Step 1: 写状态测试**

创建 `tests/frontend/novel-workflow/worldbuilding-state.test.js`：

```js
import { describe, expect, test } from '@jest/globals';

import {
    addLocalCharacter,
    addLocalLoreEntry,
    addSettingEntry,
    createWorldbuildingState,
} from '../../../public/scripts/extensions/novel-workflow/src/worldbuilding-state.js';

describe('novel workflow worldbuilding state', () => {
    test('supports local worldbuilding without SillyTavern assets', () => {
        let state = createWorldbuildingState();
        state = addSettingEntry(state, { title: 'Magic Law', body: 'Magic costs memory.' });
        state = addLocalCharacter(state, { name: 'Aren', goal: 'Recover his name' });
        state = addLocalLoreEntry(state, { title: 'North Gate', tags: ['地点:北门'] });

        expect(state.settings).toHaveLength(1);
        expect(state.characters[0].sourceType).toBe('local');
        expect(state.lore).toHaveLength(1);
    });
});
```

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/worldbuilding-state.test.js
```

Expected: FAIL，原因是 `worldbuilding-state.js` 不存在。

- [ ] **Step 3: 实现状态 helper**

创建 `worldbuilding-state.js`：

```js
export function createWorldbuildingState({ settings = [], characters = [], lore = [] } = {}) {
    return { settings, characters, lore };
}

export function addSettingEntry(state, entry) {
    return {
        ...state,
        settings: [...state.settings, { id: entry.id || `setting-${state.settings.length + 1}`, title: entry.title, body: entry.body || '', tags: entry.tags || [] }],
    };
}

export function addLocalCharacter(state, character) {
    return {
        ...state,
        characters: [...state.characters, {
            sourceType: 'local',
            id: character.id || `local-character-${state.characters.length + 1}`,
            name: character.name,
            goal: character.goal || '',
            tags: character.tags || [],
        }],
    };
}

export function addLocalLoreEntry(state, entry) {
    return {
        ...state,
        lore: [...state.lore, { id: entry.id || `lore-${state.lore.length + 1}`, title: entry.title, body: entry.body || '', tags: entry.tags || [] }],
    };
}
```

- [ ] **Step 4: 添加三个页面**

创建 `worldbuilding-pages.js`，导出：

- `renderSettingsPage(container, project)`
- `renderCharactersPage(container, project)`
- `renderLorePage(container, project)`

每个页面先显示列表和“新增”表单。表单只更新当前项目内 `localLibrary`，不调用 SillyTavern 角色卡或 World Info API。

- [ ] **Step 5: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/worldbuilding-state.test.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted test PASS，lint PASS。

- [ ] **Step 6: 停止并汇报**

汇报本地设定、角色、世界观页面能力。提示用户自行提交，不执行 git。

## Task 7: 主线、模板、大纲和场景页面

**Files:**
- Modify: `public/scripts/extensions/novel-workflow/src/outline-editor.js`
- Create: `public/scripts/extensions/novel-workflow/src/outline-pages.js`
- Modify: `public/scripts/extensions/novel-workflow/index.js`
- Test: `tests/frontend/novel-workflow/outline-editor.test.js`
- Test: `tests/frontend/novel-workflow/template-selector.test.js`

- [ ] **Step 1: 扩展 outline 测试**

在 `outline-editor.test.js` 增加：

```js
test('adds scenes without requiring external assets', () => {
    const state = createOutlineState({ mainPlotline: 'Build a kingdom', subplots: [] });
    const next = addScene(state, { title: 'First camp', goal: 'Find shelter', tags: ['主线:建国'] });

    expect(next.scenes).toHaveLength(1);
    expect(next.scenes[0].status).toBe('planned');
});
```

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/outline-editor.test.js frontend/novel-workflow/template-selector.test.js
```

Expected: FAIL，原因是 `addScene()` 尚未实现。

- [ ] **Step 3: 扩展 outline helper**

在 `outline-editor.js` 增加：

```js
export function addScene(state, scene) {
    return {
        ...state,
        scenes: [...(state.scenes || []), {
            id: scene.id || `scene-${(state.scenes || []).length + 1}`,
            title: scene.title,
            goal: scene.goal || '',
            characters: scene.characters || [],
            location: scene.location || '',
            tags: scene.tags || [],
            targetLength: scene.targetLength || 1200,
            status: scene.status || 'planned',
        }],
    };
}
```

- [ ] **Step 4: 添加页面**

创建 `outline-pages.js`，导出：

- `renderPlotlinesPage(container, project)`
- `renderTemplatesPage(container, project)`
- `renderOutlinesPage(container, project)`
- `renderScenesPage(container, project)`

页面要求：

- 主线为空时展示错误，并禁用写作入口。
- 支线可以为空。
- 模板页调用 `recommendTemplates({ genre, keywords })`。
- 场景页能添加本地场景，不要求角色卡或 World Info。

- [ ] **Step 5: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/outline-editor.test.js frontend/novel-workflow/template-selector.test.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted tests PASS，lint PASS。

- [ ] **Step 6: 停止并汇报**

汇报主线、模板、大纲、场景页面能力。提示用户自行提交，不执行 git。

## Task 8: 上下文预览页面

**Files:**
- Create: `public/scripts/extensions/novel-workflow/src/context-preview.js`
- Modify: `public/scripts/extensions/novel-workflow/index.js`
- Test: `tests/frontend/novel-workflow/context-preview.test.js`

- [ ] **Step 1: 写上下文 UI 转换测试**

创建 `tests/frontend/novel-workflow/context-preview.test.js`：

```js
import { describe, expect, test } from '@jest/globals';

import { createContextPreviewModel } from '../../../public/scripts/extensions/novel-workflow/src/context-preview.js';

describe('novel workflow context preview', () => {
    test('maps included, excluded, and used budget for display', () => {
        const model = createContextPreviewModel({
            included: [{ id: 'main', tokens: 10, reason: 'required' }],
            excluded: [{ id: 'old-lore', tokens: 80, reason: 'over-budget' }],
            used: 10,
        });

        expect(model.includedCount).toBe(1);
        expect(model.excludedCount).toBe(1);
        expect(model.usedTokens).toBe(10);
    });
});
```

- [ ] **Step 2: 运行失败验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/context-preview.test.js
```

Expected: FAIL，原因是 `context-preview.js` 不存在。

- [ ] **Step 3: 实现上下文预览模型**

创建 `context-preview.js`：

```js
export function createContextPreviewModel({ included = [], excluded = [], used = 0 } = {}) {
    return {
        included,
        excluded,
        usedTokens: used,
        includedCount: included.length,
        excludedCount: excluded.length,
    };
}

export function renderContextPreviewPage(container, contextResult) {
    const model = createContextPreviewModel(contextResult);
    container.replaceChildren();
    container.innerHTML = `
        <h4>Context Preview</h4>
        <div>Used tokens: ${model.usedTokens}</div>
        <h5>Included (${model.includedCount})</h5>
        <ul>${model.included.map(item => `<li>${item.id} - ${item.reason}</li>`).join('')}</ul>
        <h5>Excluded (${model.excludedCount})</h5>
        <ul>${model.excluded.map(item => `<li>${item.id} - ${item.reason}</li>`).join('')}</ul>
    `;
}
```

后续实现时，避免把未转义用户输入直接写入 `innerHTML`。如果 item 字段来自用户输入，应改为 DOM API 构建节点。

- [ ] **Step 4: 运行通过验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/context-preview.test.js
```

Run from repo root:

```powershell
npm run lint
```

Expected: targeted test PASS，lint PASS。

- [ ] **Step 5: 停止并汇报**

汇报上下文预览当前只显示 included/excluded/used。提示用户自行提交，不执行 git。

## Task 9: 写作页和章后审核页骨架

**Files:**
- Create: `public/scripts/extensions/novel-workflow/src/writing-pages.js`
- Modify: `public/scripts/extensions/novel-workflow/src/chapter-review.js`
- Modify: `public/scripts/extensions/novel-workflow/index.js`
- Test: `tests/frontend/novel-workflow/outline-editor.test.js`

- [ ] **Step 1: 添加审核状态测试**

在合适的前端测试文件中增加：

```js
test('chapter review starts pending and does not auto-accept notes', () => {
    const review = createChapterReviewState({
        notes: [{ type: 'summary', text: 'The hero leaves home.' }],
    });

    expect(review.status).toBe('pending');
    expect(review.notes).toHaveLength(1);
});
```

- [ ] **Step 2: 运行验收**

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/outline-editor.test.js
```

Expected: 如果当前 `chapter-review.js` 已满足则 PASS；如果没有导入测试目标，先调整测试文件导入。

- [ ] **Step 3: 创建写作和审核页面**

创建 `writing-pages.js`：

```js
export function renderWritingPage(container, project) {
    container.replaceChildren();
    const heading = document.createElement('h4');
    heading.textContent = 'Writing';

    const status = document.createElement('p');
    status.textContent = project?.mainPlotline ? 'Ready for drafting.' : 'Main plotline is required before generation.';

    const draft = document.createElement('textarea');
    draft.className = 'text_pole';
    draft.placeholder = 'Draft scene or chapter text here.';

    container.append(heading, status, draft);
}

export function renderReviewPage(container, review) {
    container.replaceChildren();
    const heading = document.createElement('h4');
    heading.textContent = 'Chapter Review';

    const status = document.createElement('p');
    status.textContent = `Status: ${review?.status || 'pending'}`;

    const list = document.createElement('ul');
    for (const note of review?.notes || []) {
        const item = document.createElement('li');
        item.textContent = `${note.type}: ${note.text}`;
        list.append(item);
    }

    container.append(heading, status, list);
}
```

此任务不接入真实生成，不调用模型 API。生成接入必须另起计划。

- [ ] **Step 4: 运行通过验收**

Run from repo root:

```powershell
npm run lint
```

Run from `tests/`:

```powershell
npm run test:unit -- frontend/novel-workflow/outline-editor.test.js
```

Expected: targeted test PASS，lint PASS。

- [ ] **Step 5: 停止并汇报**

汇报写作页是草稿骨架、审核页是 pending/notes 骨架，尚未接入生成和确认写回。提示用户自行提交，不执行 git。

## Task 10: 全流程 E2E 和最终回归

**Files:**
- Modify: `tests/frontend/novel-workflow/novel-flow.e2e.js`
- Modify: implementation files only if E2E reveals defects

- [ ] **Step 1: 扩展 E2E 覆盖页面导航**

在 `novel-flow.e2e.js` 中覆盖：

- 打开 Novel Workflow。
- 创建空白小说。
- 验证 `No chat linked`。
- 打开设定库。
- 添加本地角色。
- 打开主线/场景页。
- 打开上下文预览页。
- 打开写作页。
- 打开章后审核页。

关键断言：

```js
await expect(page.getByText(/No chat linked/i)).toBeVisible();
await expect(page.getByRole('heading', { name: /Characters/i })).toBeVisible();
await expect(page.getByRole('heading', { name: /Context Preview/i })).toBeVisible();
await expect(page.getByRole('heading', { name: /Writing/i })).toBeVisible();
await expect(page.getByRole('heading', { name: /Chapter Review/i })).toBeVisible();
```

- [ ] **Step 2: 运行目标 E2E**

确保 SillyTavern server 正在监听 `http://127.0.0.1:8000/` 后，Run from `tests/`:

```powershell
npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js
```

Expected: PASS。

- [ ] **Step 3: 运行最终回归**

Run from `tests/`:

```powershell
npm run test:unit
```

Run from repo root:

```powershell
npm run lint
```

Run from `tests/`:

```powershell
npm run test:e2e -- frontend/novel-workflow/novel-flow.e2e.js
```

Expected: unit PASS，lint PASS，targeted E2E PASS。

- [ ] **Step 4: 最终停止并汇报**

汇报所有验证命令和结果。明确说明：

- 空白小说项目可从 0 创建。
- 当前聊天不是必需依赖。
- 角色卡和 World Info 未被自动写回。
- 生成和确认写回若尚未实现，必须如实说明。
- 提示用户自行提交，不执行 git。

## 计划自审

- 已覆盖 UI 设计规格中的“完全从 0 手搓小说”主路径。
- 已把当前聊天导入放在可选路径，而不是主路径。
- 已覆盖当前实现能力：扩展入口、`/api/novels`、项目 ID 校验、项目读写、模板推荐、主线校验、支线后补、章节状态、审核状态、上下文 included/excluded/used。
- 计划任务按“测试 -> 失败验收 -> 实现 -> 通过验收 -> 停止”拆分。
- 未包含任何 git 命令。
- 未要求修改 `package.json` 或安装新依赖。
- 生成能力和确认写回未被混入本计划，避免把未实现功能伪装成已完成。
