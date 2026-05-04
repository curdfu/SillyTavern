import { describe, test, expect } from '@jest/globals';

import { createOutlineState, canAddSubplot, validateMainPlotlineRequired } from '../../../public/scripts/extensions/novel-workflow/src/outline-editor.js';

describe('outline editor', () => {
    test('requires main plotline before generation and allows subplots later', () => {
        const state = createOutlineState({ mainPlotline: null, subplots: [] });

        expect(validateMainPlotlineRequired(state)).toBe(false);
        expect(canAddSubplot(state)).toBe(true);
    });
});
