import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, test, expect } from '@jest/globals';
import express from 'express';

import { router as novelsRouter } from '../../src/endpoints/novels.js';

const tempRoots = [];

async function createTempDirectories() {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sillytavern-novels-api-test-'));
    tempRoots.push(root);

    return { user: path.join(root, 'user') };
}

function createTestApp(directories) {
    const app = express();
    app.use(express.json());
    app.use((request, _response, next) => {
        request.user = { directories };
        next();
    });
    app.use('/api/novels', novelsRouter);

    return app;
}

async function requestJson(app, route, { method = 'GET', body = undefined } = {}) {
    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));

    try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}${route}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        const contentType = response.headers.get('content-type') || '';

        return {
            status: response.status,
            body: text && contentType.includes('application/json') ? JSON.parse(text) : text,
        };
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

describe('novels api', () => {
    test('exports an express router', () => {
        const app = express();
        app.use('/api/novels', novelsRouter);

        expect(novelsRouter).toBeDefined();
        expect(typeof novelsRouter.use).toBe('function');
    });

    test('creates, lists, and reads a blank novel project', async () => {
        const directories = await createTempDirectories();
        const app = createTestApp(directories);
        const project = {
            id: 'novel_blank_001',
            title: 'Blank Novel',
            genre: 'Fantasy',
            synopsis: '',
            mainPlotline: 'Find the lost city',
        };

        const createResponse = await requestJson(app, '/api/novels/projects', { method: 'POST', body: project });
        expect(createResponse.status).toBe(201);
        expect(createResponse.body.id).toBe('novel_blank_001');

        const listResponse = await requestJson(app, '/api/novels/projects');
        expect(listResponse.status).toBe(200);
        expect(listResponse.body.projects).toHaveLength(1);

        const readResponse = await requestJson(app, '/api/novels/projects/novel_blank_001');
        expect(readResponse.status).toBe(200);
        expect(readResponse.body.title).toBe('Blank Novel');
    });

    test('rejects blank project creation without a main plotline', async () => {
        const directories = await createTempDirectories();
        const app = createTestApp(directories);

        const response = await requestJson(app, '/api/novels/projects', {
            method: 'POST',
            body: {
                id: 'novel_blank_002',
                title: 'Invalid Novel',
                mainPlotline: '',
            },
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('main plotline');
    });
});
