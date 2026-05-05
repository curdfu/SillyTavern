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
