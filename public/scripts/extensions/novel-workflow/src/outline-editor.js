export function createOutlineState({ mainPlotline = null, subplots = [], scenes = [] } = {}) {
    return { mainPlotline, subplots, scenes };
}

export function validateMainPlotlineRequired(state) {
    return Boolean(state?.mainPlotline);
}

export function canAddSubplot(_state) {
    return true;
}

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
