import { describe, expect, test } from '@jest/globals';

import {
    createBlankNovelProject,
    createProjectIdFromTitle,
    validateBlankNovelProject,
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
