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
