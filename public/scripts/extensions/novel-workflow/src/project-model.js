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

    if (id && /[\\/]|(?:\.\.)/.test(id)) {
        errors.push('project id is invalid');
    }

    return { valid: errors.length === 0, errors };
}

export function createBlankNovelProject({ id, title, genre = '', synopsis = '', mainPlotline, initialGoal = '' } = {}) {
    const now = new Date().toISOString();

    return {
        id: id || createProjectIdFromTitle(title),
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
