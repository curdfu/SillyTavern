export function renderProjectsPage(container, state) {
    container.replaceChildren();

    const title = document.createElement('h4');
    title.textContent = 'My Novels';

    const empty = document.createElement('p');
    empty.textContent = state.projects.length === 0 ? 'No novel projects yet.' : '';

    const newButton = document.createElement('button');
    newButton.type = 'button';
    newButton.className = 'menu_button';
    newButton.dataset.novelPage = 'new';
    newButton.textContent = 'Blank Novel';

    container.append(title, empty, newButton);
}

export function renderNewProjectPage(container, { onCreate } = {}) {
    container.replaceChildren();

    const title = document.createElement('h4');
    title.textContent = 'New Novel';

    const form = document.createElement('form');
    form.className = 'novel-workflow__form';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.className = 'text_pole';
    titleInput.name = 'title';
    titleInput.required = true;
    titleLabel.append(titleInput);

    const genreLabel = document.createElement('label');
    genreLabel.textContent = 'Genre';
    const genreInput = document.createElement('input');
    genreInput.className = 'text_pole';
    genreInput.name = 'genre';
    genreLabel.append(genreInput);

    const plotlineLabel = document.createElement('label');
    plotlineLabel.textContent = 'Main plotline';
    const plotlineInput = document.createElement('textarea');
    plotlineInput.className = 'text_pole';
    plotlineInput.name = 'mainPlotline';
    plotlineInput.required = true;
    plotlineLabel.append(plotlineInput);

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'menu_button';
    submitButton.textContent = 'Create Blank Novel';

    form.append(titleLabel, genreLabel, plotlineLabel, submitButton);
    form.addEventListener('submit', event => {
        event.preventDefault();

        onCreate?.({
            title: titleInput.value,
            genre: genreInput.value,
            mainPlotline: plotlineInput.value,
        });
    });

    container.append(title, form);
}

export function renderProjectOverviewPage(container, project) {
    container.replaceChildren();

    const title = document.createElement('h4');
    title.textContent = project.title;

    const chatStatus = document.createElement('p');
    chatStatus.textContent = project.sources?.chat ? 'Chat linked' : 'No chat linked';

    const mainPlotline = document.createElement('p');
    mainPlotline.textContent = `Main plotline: ${project.mainPlotline}`;

    const localCharacters = document.createElement('p');
    localCharacters.textContent = `Local characters: ${project.localLibrary?.characters?.length ?? 0}`;

    const worldInfoBindings = document.createElement('p');
    worldInfoBindings.textContent = `World Info bindings: ${project.sources?.worlds?.length ?? 0}`;

    const actions = document.createElement('div');
    actions.className = 'novel-workflow__actions';

    const settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'menu_button';
    settingsButton.dataset.novelPage = 'worldbuilding';
    settingsButton.textContent = 'Settings';

    const charactersButton = document.createElement('button');
    charactersButton.type = 'button';
    charactersButton.className = 'menu_button';
    charactersButton.dataset.novelPage = 'characters';
    charactersButton.textContent = 'Characters';

    const loreButton = document.createElement('button');
    loreButton.type = 'button';
    loreButton.className = 'menu_button';
    loreButton.dataset.novelPage = 'lore';
    loreButton.textContent = 'Worldbuilding';

    const plotlinesButton = document.createElement('button');
    plotlinesButton.type = 'button';
    plotlinesButton.className = 'menu_button';
    plotlinesButton.dataset.novelPage = 'plotlines';
    plotlinesButton.textContent = 'Plotlines';

    const templatesButton = document.createElement('button');
    templatesButton.type = 'button';
    templatesButton.className = 'menu_button';
    templatesButton.dataset.novelPage = 'templates';
    templatesButton.textContent = 'Templates';

    const outlinesButton = document.createElement('button');
    outlinesButton.type = 'button';
    outlinesButton.className = 'menu_button';
    outlinesButton.dataset.novelPage = 'outlines';
    outlinesButton.textContent = 'Outlines';

    const scenesButton = document.createElement('button');
    scenesButton.type = 'button';
    scenesButton.className = 'menu_button';
    scenesButton.dataset.novelPage = 'scenes';
    scenesButton.textContent = 'Scenes';

    const contextButton = document.createElement('button');
    contextButton.type = 'button';
    contextButton.className = 'menu_button';
    contextButton.dataset.novelPage = 'context';
    contextButton.textContent = 'Context';

    const writingButton = document.createElement('button');
    writingButton.type = 'button';
    writingButton.className = 'menu_button';
    writingButton.dataset.novelPage = 'writing';
    writingButton.textContent = 'Writing';

    const reviewButton = document.createElement('button');
    reviewButton.type = 'button';
    reviewButton.className = 'menu_button';
    reviewButton.dataset.novelPage = 'review';
    reviewButton.textContent = 'Review';

    actions.append(settingsButton, charactersButton, loreButton, plotlinesButton, templatesButton, outlinesButton, scenesButton, contextButton, writingButton, reviewButton);
    container.append(title, chatStatus, mainPlotline, localCharacters, worldInfoBindings, actions);
}
