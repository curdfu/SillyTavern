import fs from 'node:fs/promises';
import path from 'node:path';

import { getNovelProjectPath, getNovelProjectsRoot, isValidNovelProjectId } from './paths.js';

export function normalizeNovelProject(project) {
    const now = new Date().toISOString();

    return {
        id: project?.id,
        title: String(project?.title || '').trim(),
        genre: String(project?.genre || '').trim(),
        synopsis: String(project?.synopsis || '').trim(),
        mainPlotline: String(project?.mainPlotline || '').trim(),
        current: project?.current || { volumeId: null, chapterId: null, sceneId: null },
        sources: project?.sources || { chat: null, characters: [], worlds: [], memoryCollections: [], vectorCollections: [] },
        localLibrary: project?.localLibrary || { settings: [], characters: [], lore: [] },
        createdAt: project?.createdAt || now,
        updatedAt: now,
    };
}

export async function listNovelProjects(directories) {
    const root = getNovelProjectsRoot(directories);
    let entries = [];

    try {
        entries = await fs.readdir(root, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }

    const projects = [];
    for (const entry of entries) {
        if (!entry.isDirectory() || !isValidNovelProjectId(entry.name)) {
            continue;
        }

        try {
            projects.push(await readNovelProject(directories, entry.name));
        } catch {
            continue;
        }
    }

    return projects.sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export async function writeNovelProject(directories, project) {
    if (!isValidNovelProjectId(project?.id)) {
        throw new Error('Invalid novel project id');
    }

    const projectPath = getNovelProjectPath(directories, project.id);
    await fs.mkdir(projectPath, { recursive: true });
    await fs.writeFile(path.join(projectPath, 'project.json'), JSON.stringify(project, null, 2), 'utf8');
}

export async function readNovelProject(directories, projectId) {
    const projectPath = getNovelProjectPath(directories, projectId);
    const raw = await fs.readFile(path.join(projectPath, 'project.json'), 'utf8');

    return JSON.parse(raw);
}
