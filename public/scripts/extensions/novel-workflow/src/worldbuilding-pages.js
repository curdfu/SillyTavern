import { addLocalCharacter, addLocalLoreEntry, addSettingEntry, createWorldbuildingState } from './worldbuilding-state.js';

function getWorldbuildingState(project) {
    return createWorldbuildingState(project?.localLibrary || {});
}

function setWorldbuildingState(project, worldbuildingState) {
    project.localLibrary = {
        ...project.localLibrary,
        settings: worldbuildingState.settings,
        characters: worldbuildingState.characters,
        lore: worldbuildingState.lore,
    };
}

function appendList(container, entries, emptyText) {
    const list = document.createElement('ul');

    if (entries.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = emptyText;
        list.append(empty);
    }

    for (const entry of entries) {
        const item = document.createElement('li');
        item.textContent = entry.name || entry.title;
        list.append(item);
    }

    container.append(list);
}

export function renderSettingsPage(container, project) {
    container.replaceChildren();
    const state = getWorldbuildingState(project);
    const heading = document.createElement('h4');
    heading.textContent = 'Settings';
    appendList(container, state.settings, 'No local settings yet.');

    const form = document.createElement('form');
    form.className = 'novel-workflow__form';
    form.innerHTML = `
        <label>Title <input class="text_pole" name="title" required></label>
        <label>Body <textarea class="text_pole" name="body"></textarea></label>
        <button type="submit" class="menu_button">Add Setting</button>
    `;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        setWorldbuildingState(project, addSettingEntry(getWorldbuildingState(project), {
            title: formData.get('title'),
            body: formData.get('body'),
        }));
        renderSettingsPage(container, project);
    });

    container.prepend(heading);
    container.append(form);
}

export function renderCharactersPage(container, project) {
    container.replaceChildren();
    const state = getWorldbuildingState(project);
    const heading = document.createElement('h4');
    heading.textContent = 'Characters';
    appendList(container, state.characters, 'No local characters yet.');

    const form = document.createElement('form');
    form.className = 'novel-workflow__form';
    form.innerHTML = `
        <label>Name <input class="text_pole" name="name" required></label>
        <label>Goal <textarea class="text_pole" name="goal"></textarea></label>
        <button type="submit" class="menu_button">Add Character</button>
    `;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        setWorldbuildingState(project, addLocalCharacter(getWorldbuildingState(project), {
            name: formData.get('name'),
            goal: formData.get('goal'),
        }));
        renderCharactersPage(container, project);
    });

    container.prepend(heading);
    container.append(form);
}

export function renderLorePage(container, project) {
    container.replaceChildren();
    const state = getWorldbuildingState(project);
    const heading = document.createElement('h4');
    heading.textContent = 'Worldbuilding';
    appendList(container, state.lore, 'No local lore yet.');

    const form = document.createElement('form');
    form.className = 'novel-workflow__form';
    form.innerHTML = `
        <label>Title <input class="text_pole" name="title" required></label>
        <label>Body <textarea class="text_pole" name="body"></textarea></label>
        <button type="submit" class="menu_button">Add Lore</button>
    `;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        setWorldbuildingState(project, addLocalLoreEntry(getWorldbuildingState(project), {
            title: formData.get('title'),
            body: formData.get('body'),
        }));
        renderLorePage(container, project);
    });

    container.prepend(heading);
    container.append(form);
}
