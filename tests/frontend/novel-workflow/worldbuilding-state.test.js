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
