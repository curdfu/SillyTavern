import { renderExtensionTemplateAsync } from '../../extensions.js';
import { renderContextPreviewPage } from './src/context-preview.js';
import { createNovelProject } from './src/project-client.js';
import { createBlankNovelProject } from './src/project-model.js';
import { renderOutlinesPage, renderPlotlinesPage, renderScenesPage, renderTemplatesPage } from './src/outline-pages.js';
import { renderNewProjectPage, renderProjectOverviewPage, renderProjectsPage } from './src/project-pages.js';
import { createWorkbenchState, selectWorkbenchPage, setActiveProject } from './src/workbench-state.js';
import { renderCharactersPage, renderLorePage, renderSettingsPage } from './src/worldbuilding-pages.js';
import { renderReviewPage, renderWritingPage } from './src/writing-pages.js';

const MODULE_NAME = 'novel-workflow';
const MENU_BUTTON_ID = 'novel_workflow_menu_button';
let state = createWorkbenchState();
let initialized = false;
let localizationObserver = null;
let localizationQueued = false;

console.debug(`${MODULE_NAME} extension initialized`);

const PROJECT_PAGES = [
    ['overview', '概览'],
    ['worldbuilding', '设定'],
    ['characters', '角色'],
    ['lore', '世界观'],
    ['plotlines', '剧情线'],
    ['templates', '模板'],
    ['outlines', '大纲'],
    ['scenes', '场景'],
    ['context', '上下文'],
    ['writing', '写作'],
    ['review', '审阅'],
];

const TEXT_TRANSLATIONS = new Map([
    ['Novel Workflow', '小说工作流'],
    ['Projects', '项目'],
    ['New', '新建'],
    ['My Novels', '我的小说'],
    ['No novel projects yet.', '还没有小说项目。'],
    ['Blank Novel', '空白小说'],
    ['New Novel', '新建小说'],
    ['Title', '标题'],
    ['Genre', '类型'],
    ['Main plotline', '主线剧情'],
    ['Create Blank Novel', '创建空白小说'],
    ['Chat linked', '已关联聊天'],
    ['No chat linked', '未关联聊天'],
    ['Settings', '设定'],
    ['Characters', '角色'],
    ['Worldbuilding', '世界观'],
    ['Plotlines', '剧情线'],
    ['Templates', '模板'],
    ['Outlines', '大纲'],
    ['Scenes', '场景'],
    ['Context', '上下文'],
    ['Writing', '写作'],
    ['Review', '审阅'],
    ['No local settings yet.', '还没有本地设定。'],
    ['Body', '正文'],
    ['Add Setting', '添加设定'],
    ['No local characters yet.', '还没有本地角色。'],
    ['Name', '名称'],
    ['Goal', '目标'],
    ['Add Character', '添加角色'],
    ['No local lore yet.', '还没有本地世界观资料。'],
    ['Add Lore', '添加世界观资料'],
    ['No scenes planned yet.', '还没有规划场景。'],
    ['Main plotline is required before generation.', '生成前必须填写主线剧情。'],
    ['Scenes can be planned.', '可以规划场景。'],
    ['Add Scene', '添加场景'],
    ['Context Preview', '上下文预览'],
    ['No context items.', '没有上下文项目。'],
    ['Included', '已纳入'],
    ['Excluded', '已排除'],
    ['Ready for drafting.', '可以开始起草。'],
    ['Draft scene or chapter text here.', '在这里起草场景或章节正文。'],
    ['Chapter Review', '章节审阅'],
    ['Open Novel Workflow', '打开小说工作流'],
    ['Novel workflow pages', '小说工作流页面'],
    ['pending', '待处理'],
    ['planned', '已规划'],
    ['required', '必需'],
    ['main-plotline', '主线剧情'],
]);

function translateText(text) {
    let translated = TEXT_TRANSLATIONS.get(text) || text;
    translated = translated.replace(/^Main plotline: /, '主线剧情：');
    translated = translated.replace(/^Local characters: /, '本地角色：');
    translated = translated.replace(/^World Info bindings: /, 'World Info 绑定：');
    translated = translated.replace(/^Subplots: /, '支线数量：');
    translated = translated.replace(/^Genre: None$/, '类型：无');
    translated = translated.replace(/^Genre: /, '类型：');
    translated = translated.replace(/^Volumes: /, '卷数：');
    translated = translated.replace(/^Chapters: /, '章节数：');
    translated = translated.replace(/^Used tokens: /, '已用 Token：');
    translated = translated.replace(/^Included \((\d+)\)$/, '已纳入 ($1)');
    translated = translated.replace(/^Excluded \((\d+)\)$/, '已排除 ($1)');
    translated = translated.replace(/^Status: pending$/, '状态：待处理');
    translated = translated.replace(/^(.+) - planned$/, '$1 - 已规划');
    translated = translated.replace(/^main-plotline - required$/, '主线剧情 - 必需');
    return translated;
}

function localizeWorkbench(root) {
    if (!root) {
        return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
        const original = node.nodeValue;
        const trimmed = original.trim();
        if (!trimmed) {
            continue;
        }

        const translated = translateText(trimmed);
        if (translated !== trimmed) {
            node.nodeValue = original.replace(trimmed, translated);
        }
    }

    for (const attribute of ['placeholder', 'title', 'aria-label']) {
        for (const element of root.querySelectorAll(`[${attribute}]`)) {
            element.setAttribute(attribute, translateText(element.getAttribute(attribute)));
        }
    }
}

function startLocalizationObserver(workbench) {
    if (!workbench || localizationObserver) {
        return;
    }

    localizationObserver = new MutationObserver(() => {
        if (localizationQueued) {
            return;
        }

        localizationQueued = true;
        queueMicrotask(() => {
            localizationQueued = false;
            localizeWorkbench(workbench);
        });
    });
    localizationObserver.observe(workbench, { childList: true, subtree: true });
}

async function ensureWorkbench() {
    const existingWorkbench = document.querySelector('#novel_workflow_workbench');
    if (existingWorkbench) {
        return existingWorkbench;
    }

    const html = await renderExtensionTemplateAsync(MODULE_NAME, 'workbench');
    document.body.insertAdjacentHTML('beforeend', html);

    const workbench = document.querySelector('#novel_workflow_workbench');
    const actions = workbench?.querySelector('.novel-workflow__actions');
    if (actions && !workbench.querySelector('[data-novel-close]')) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'menu_button';
        closeButton.dataset.novelClose = 'true';
        closeButton.textContent = '关闭';
        actions.append(closeButton);
    }
    localizeWorkbench(workbench);
    startLocalizationObserver(workbench);

    return workbench;
}

function renderNavigation() {
    const navigation = document.querySelector('.novel-workflow__nav');
    if (!navigation) {
        return;
    }

    navigation.replaceChildren();

    if (!state.activeProject) {
        return;
    }

    for (const [page, label] of PROJECT_PAGES) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'menu_button';
        button.dataset.novelPage = page;
        button.textContent = label;
        navigation.append(button);
    }
}

function renderWorkbench() {
    const body = document.querySelector('[data-novel-body]');
    if (!body) {
        return;
    }

    renderNavigation();

    if (state.activePage === 'overview' && state.activeProject) {
        renderProjectOverviewPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'worldbuilding' && state.activeProject) {
        renderSettingsPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'characters' && state.activeProject) {
        renderCharactersPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'lore' && state.activeProject) {
        renderLorePage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'plotlines' && state.activeProject) {
        renderPlotlinesPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'templates' && state.activeProject) {
        renderTemplatesPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'outlines' && state.activeProject) {
        renderOutlinesPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'scenes' && state.activeProject) {
        renderScenesPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'context' && state.activeProject) {
        renderContextPreviewPage(body, {
            included: [{ id: 'main-plotline', tokens: state.activeProject.mainPlotline.length, reason: 'required' }],
            excluded: [],
            used: state.activeProject.mainPlotline.length,
        });
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'writing' && state.activeProject) {
        renderWritingPage(body, state.activeProject);
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'review' && state.activeProject) {
        renderReviewPage(body, state.activeProject.reviews?.[0] || { status: 'pending', notes: [] });
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    if (state.activePage === 'new') {
        renderNewProjectPage(body, { onCreate: handleCreateBlankProject });
        localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
        return;
    }

    renderProjectsPage(body, state);
    localizeWorkbench(document.querySelector('#novel_workflow_workbench'));
}

async function handleCreateBlankProject(formData) {
    const project = createBlankNovelProject(formData);
    const createdProject = await createNovelProject(project);
    state = setActiveProject(state, createdProject);
    renderWorkbench();
}

async function openWorkbench() {
    const workbench = await ensureWorkbench();
    workbench.classList.remove('hidden');
    renderWorkbench();
}

function closeWorkbench() {
    document.querySelector('#novel_workflow_workbench')?.classList.add('hidden');
}

function registerMenuEntry() {
    if (document.querySelector(`#${MENU_BUTTON_ID}`)) {
        return true;
    }

    const container = document.querySelector('#novel_workflow_wand_container') || document.querySelector('#extensionsMenu');
    if (!container) {
        return false;
    }

    const button = document.createElement('button');
    button.id = MENU_BUTTON_ID;
    button.type = 'button';
    button.className = 'flex-container flexGap5 novel-workflow__menu-entry';
    button.title = '打开小说工作流';

    const icon = document.createElement('div');
    icon.className = 'fa-solid fa-book-open-reader extensionsMenuExtensionButton';

    const label = document.createElement('span');
    label.textContent = '小说工作流';

    button.append(icon, label);
    button.addEventListener('click', openWorkbench);
    container.append(button);

    return true;
}

function registerMenuEntryWhenReady() {
    if (registerMenuEntry()) {
        return;
    }

    const observer = new MutationObserver(() => {
        if (registerMenuEntry()) {
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export function init() {
    if (initialized) {
        return;
    }

    initialized = true;
    registerMenuEntryWhenReady();
    document.addEventListener('click', event => {
        if (event.target?.dataset?.novelClose) {
            closeWorkbench();
            return;
        }

        const page = event.target?.dataset?.novelPage;
        if (!page) {
            return;
        }

        state = selectWorkbenchPage(state, page);
        renderWorkbench();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeWorkbench();
        }
    });
}

export { MODULE_NAME };
