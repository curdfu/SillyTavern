export function createWorldbuildingState({ settings = [], characters = [], lore = [] } = {}) {
    return { settings, characters, lore };
}

export function addSettingEntry(state, entry) {
    return {
        ...state,
        settings: [...state.settings, {
            id: entry.id || `setting-${state.settings.length + 1}`,
            title: entry.title,
            body: entry.body || '',
            tags: entry.tags || [],
        }],
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
        lore: [...state.lore, {
            id: entry.id || `lore-${state.lore.length + 1}`,
            title: entry.title,
            body: entry.body || '',
            tags: entry.tags || [],
        }],
    };
}
