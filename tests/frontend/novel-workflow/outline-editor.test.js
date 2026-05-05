import { describe, test, expect } from '@jest/globals';

import { createChapterReviewState } from '../../../public/scripts/extensions/novel-workflow/src/chapter-review.js';
import { addScene, createOutlineState, canAddSubplot, validateMainPlotlineRequired } from '../../../public/scripts/extensions/novel-workflow/src/outline-editor.js';

describe('outline editor', () => {
    test('requires main plotline before generation and allows subplots later', () => {
        const state = createOutlineState({ mainPlotline: null, subplots: [] });

        expect(validateMainPlotlineRequired(state)).toBe(false);
        expect(canAddSubplot(state)).toBe(true);
    });

    test('adds scenes without requiring external assets', () => {
        const state = createOutlineState({ mainPlotline: 'Build a kingdom', subplots: [] });
        const next = addScene(state, { title: 'First camp', goal: 'Find shelter', tags: ['主线:建国'] });

        expect(next.scenes).toHaveLength(1);
        expect(next.scenes[0].status).toBe('planned');
    });

    test('chapter review starts pending and does not auto-accept notes', () => {
        const review = createChapterReviewState({
            notes: [{ type: 'summary', text: 'The hero leaves home.' }],
        });

        expect(review.status).toBe('pending');
        expect(review.notes).toHaveLength(1);
    });
});
