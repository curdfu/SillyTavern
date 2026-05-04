import { describe, test, expect } from '@jest/globals';

import { recommendTemplates } from '../../../public/scripts/extensions/novel-workflow/src/template-selector.js';

describe('template selector', () => {
    test('recommends growth template for fantasy progression stories', () => {
        const templates = recommendTemplates({ genre: '玄幻', keywords: ['升级', '突破'] });

        expect(templates).toContain('升级流/成长流');
    });

    test('returns at least one default template', () => {
        const templates = recommendTemplates({});

        expect(templates.length).toBeGreaterThan(0);
    });
});
