import { describe, expect, test } from '@jest/globals';

import { createContextPreviewModel } from '../../../public/scripts/extensions/novel-workflow/src/context-preview.js';

describe('novel workflow context preview', () => {
    test('maps included, excluded, and used budget for display', () => {
        const model = createContextPreviewModel({
            included: [{ id: 'main', tokens: 10, reason: 'required' }],
            excluded: [{ id: 'old-lore', tokens: 80, reason: 'over-budget' }],
            used: 10,
        });

        expect(model.includedCount).toBe(1);
        expect(model.excludedCount).toBe(1);
        expect(model.usedTokens).toBe(10);
    });
});
