export function renderWritingPage(container, project) {
    container.replaceChildren();

    const heading = document.createElement('h4');
    heading.textContent = 'Writing';

    const status = document.createElement('p');
    status.textContent = project?.mainPlotline ? 'Ready for drafting.' : 'Main plotline is required before generation.';

    const draft = document.createElement('textarea');
    draft.className = 'text_pole';
    draft.placeholder = 'Draft scene or chapter text here.';

    container.append(heading, status, draft);
}

export function renderReviewPage(container, review) {
    container.replaceChildren();

    const heading = document.createElement('h4');
    heading.textContent = 'Chapter Review';

    const status = document.createElement('p');
    status.textContent = `Status: ${review?.status || 'pending'}`;

    const list = document.createElement('ul');
    for (const note of review?.notes || []) {
        const item = document.createElement('li');
        item.textContent = `${note.type}: ${note.text}`;
        list.append(item);
    }

    container.append(heading, status, list);
}
