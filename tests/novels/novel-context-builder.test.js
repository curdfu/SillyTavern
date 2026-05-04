import { describe, test, expect } from '@jest/globals';

import { buildNovelContext } from '../../src/novels/novel-context-builder.js';

describe('novel context builder', () => {
    test('keeps required context, includes budgeted candidates, and excludes over-budget candidates', () => {
        const result = buildNovelContext({
            required: ['current chapter outline'],
            candidates: [
                { id: 'active-character', tokens: 120, tags: ['character:A'] },
                { id: 'unrelated-world', tokens: 500, tags: ['location:elsewhere'] },
            ],
            budget: 200,
        });

        expect(result.included).toEqual([
            { id: 'current chapter outline', tokens: 23, reason: 'required' },
            { id: 'active-character', tokens: 120, tags: ['character:A'], reason: 'selected' },
        ]);
        expect(result.excluded).toEqual([
            { id: 'unrelated-world', tokens: 500, tags: ['location:elsewhere'], reason: 'over-budget' },
        ]);
        expect(result.used).toBe(143);
    });
});
