import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from '@jest/globals';

import { readNovelProject, writeNovelProject } from '../../src/novels/project-store.js';

const tempRoots = [];

async function createTempDirectories() {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sillytavern-novels-test-'));
    tempRoots.push(root);

    return { user: path.join(root, 'user') };
}

afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

describe('novel project persistence', () => {
    test('writes and reads back a project snapshot', async () => {
        const directories = await createTempDirectories();
        const project = { id: 'novel_001', title: 'Test Project', updatedAt: new Date().toISOString() };

        await writeNovelProject(directories, project);
        const loaded = await readNovelProject(directories, 'novel_001');

        expect(loaded).toEqual(project);
    });

    test('rejects invalid project ids before writing', async () => {
        const directories = await createTempDirectories();

        await expect(writeNovelProject(directories, { id: '../escape', title: 'Unsafe' })).rejects.toThrow('Invalid novel project id');
    });
});
