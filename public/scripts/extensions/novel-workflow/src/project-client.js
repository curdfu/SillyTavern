import { getRequestHeaders } from '../../../../script.js';

export async function listNovelProjects() {
    const response = await fetch('/api/novels/projects', {
        headers: getRequestHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to list novel projects: ${response.status}`);
    }

    return response.json();
}

export async function createNovelProject(project) {
    const response = await fetch('/api/novels/projects', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(project),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `Failed to create novel project: ${response.status}`);
    }

    return response.json();
}
