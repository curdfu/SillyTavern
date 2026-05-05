import { addScene, createOutlineState, validateMainPlotlineRequired } from './outline-editor.js';
import { recommendTemplates } from './template-selector.js';

function getOutlineState(project) {
    return createOutlineState({
        mainPlotline: project?.mainPlotline || null,
        subplots: project?.subplots || [],
        scenes: project?.outlines?.scenes || [],
    });
}

function setScenes(project, scenes) {
    project.outlines = {
        ...project.outlines,
        scenes,
    };
}

function appendSceneList(container, scenes) {
    const list = document.createElement('ul');
    if (scenes.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = 'No scenes planned yet.';
        list.append(empty);
    }

    for (const scene of scenes) {
        const item = document.createElement('li');
        item.textContent = `${scene.title} - ${scene.status}`;
        list.append(item);
    }

    container.append(list);
}

export function renderPlotlinesPage(container, project) {
    container.replaceChildren();
    const outline = getOutlineState(project);
    const heading = document.createElement('h4');
    heading.textContent = 'Plotlines';

    const main = document.createElement('p');
    main.textContent = outline.mainPlotline ? `Main plotline: ${outline.mainPlotline}` : 'Main plotline is required before generation.';

    const subplots = document.createElement('p');
    subplots.textContent = `Subplots: ${outline.subplots.length}`;

    container.append(heading, main, subplots);
}

export function renderTemplatesPage(container, project) {
    container.replaceChildren();
    const heading = document.createElement('h4');
    heading.textContent = 'Templates';

    const genre = document.createElement('p');
    genre.textContent = `Genre: ${project?.genre || 'None'}`;

    const recommendations = document.createElement('ul');
    for (const template of recommendTemplates({ genre: project?.genre || '', keywords: [] })) {
        const item = document.createElement('li');
        item.textContent = template;
        recommendations.append(item);
    }

    container.append(heading, genre, recommendations);
}

export function renderOutlinesPage(container, project) {
    container.replaceChildren();
    const heading = document.createElement('h4');
    heading.textContent = 'Outlines';

    const volumes = document.createElement('p');
    volumes.textContent = `Volumes: ${project?.outlines?.volumes?.length ?? 0}`;

    const chapters = document.createElement('p');
    chapters.textContent = `Chapters: ${project?.outlines?.chapters?.length ?? 0}`;

    container.append(heading, volumes, chapters);
}

export function renderScenesPage(container, project) {
    container.replaceChildren();
    const outline = getOutlineState(project);
    const heading = document.createElement('h4');
    heading.textContent = 'Scenes';

    const generationStatus = document.createElement('p');
    generationStatus.textContent = validateMainPlotlineRequired(outline) ? 'Scenes can be planned.' : 'Main plotline is required before generation.';

    appendSceneList(container, outline.scenes);

    const form = document.createElement('form');
    form.className = 'novel-workflow__form';
    form.innerHTML = `
        <label>Title <input class="text_pole" name="title" required></label>
        <label>Goal <textarea class="text_pole" name="goal"></textarea></label>
        <button type="submit" class="menu_button">Add Scene</button>
    `;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        const next = addScene(getOutlineState(project), {
            title: formData.get('title'),
            goal: formData.get('goal'),
        });
        setScenes(project, next.scenes);
        renderScenesPage(container, project);
    });

    container.prepend(heading, generationStatus);
    container.append(form);
}
