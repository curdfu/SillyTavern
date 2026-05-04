import fs from 'node:fs/promises';
import path from 'node:path';

import { getNovelProjectPath, isValidNovelProjectId } from './paths.js';

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
