import express from 'express';

import { listNovelProjects, normalizeNovelProject, readNovelProject, writeNovelProject } from '../novels/project-store.js';

export const router = express.Router();

router.get('/', (_request, response) => response.sendStatus(204));

router.get('/projects', async (request, response) => {
    try {
        const projects = await listNovelProjects(request.user.directories);
        response.json({ projects });
    } catch {
        response.status(500).json({ error: 'Failed to list novel projects' });
    }
});

router.post('/projects', async (request, response) => {
    try {
        const project = normalizeNovelProject(request.body);
        if (!project.title) {
            return response.status(400).json({ error: 'Novel title is required' });
        }
        if (!project.mainPlotline) {
            return response.status(400).json({ error: 'Novel main plotline is required' });
        }

        await writeNovelProject(request.user.directories, project);
        return response.status(201).json(project);
    } catch (error) {
        if (error.message?.includes('Invalid novel project id')) {
            return response.status(400).json({ error: 'Invalid novel project id' });
        }

        return response.status(500).json({ error: 'Failed to create novel project' });
    }
});

router.get('/projects/:projectId', async (request, response) => {
    try {
        const project = await readNovelProject(request.user.directories, request.params.projectId);
        response.json(project);
    } catch (error) {
        if (error.message?.includes('Invalid novel project id')) {
            return response.status(400).json({ error: 'Invalid novel project id' });
        }
        if (error.code === 'ENOENT') {
            return response.status(404).json({ error: 'Novel project not found' });
        }

        return response.status(500).json({ error: 'Failed to read novel project' });
    }
});
