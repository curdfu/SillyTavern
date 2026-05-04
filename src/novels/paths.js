import path from 'node:path';
import sanitize from 'sanitize-filename';

export function isValidNovelProjectId(projectId) {
    return typeof projectId === 'string'
        && projectId.length > 0
        && projectId === sanitize(projectId)
        && !projectId.includes('..')
        && !projectId.includes('/')
        && !projectId.includes('\\');
}

export function getNovelProjectsRoot(directories) {
    return path.join(directories.user, 'novels');
}

export function getNovelProjectPath(directories, projectId) {
    if (!isValidNovelProjectId(projectId)) {
        throw new Error(`Invalid novel project id: ${projectId}`);
    }

    return path.join(getNovelProjectsRoot(directories), projectId);
}
