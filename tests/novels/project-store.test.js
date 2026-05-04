import { describe, test, expect } from '@jest/globals';

import { getNovelProjectPath, isValidNovelProjectId } from '../../src/novels/paths.js';

describe('novel paths', () => {
    test('rejects unsafe project ids', () => {
        expect(isValidNovelProjectId('../escape')).toBe(false);
        expect(isValidNovelProjectId('novel_001')).toBe(true);
    });

    test('builds project path under user novels directory', () => {
        const directories = { user: 'C:/data/default-user/user' };

        expect(getNovelProjectPath(directories, 'novel_001')).toContain('novels');
    });

    test('throws for invalid project ids', () => {
        const directories = { user: 'C:/data/default-user/user' };

        expect(() => getNovelProjectPath(directories, '../escape')).toThrow('Invalid novel project id');
    });
});
