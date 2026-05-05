export function createContextPreviewModel({ included = [], excluded = [], used = 0 } = {}) {
    return {
        included,
        excluded,
        usedTokens: used,
        includedCount: included.length,
        excludedCount: excluded.length,
    };
}

function appendContextList(container, items) {
    const list = document.createElement('ul');

    if (items.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = 'No context items.';
        list.append(empty);
    }

    for (const item of items) {
        const row = document.createElement('li');
        row.textContent = `${item.id} - ${item.reason}`;
        list.append(row);
    }

    container.append(list);
}

export function renderContextPreviewPage(container, contextResult) {
    const model = createContextPreviewModel(contextResult);
    container.replaceChildren();

    const heading = document.createElement('h4');
    heading.textContent = 'Context Preview';

    const used = document.createElement('p');
    used.textContent = `Used tokens: ${model.usedTokens}`;

    const includedHeading = document.createElement('h5');
    includedHeading.textContent = `Included (${model.includedCount})`;

    const excludedHeading = document.createElement('h5');
    excludedHeading.textContent = `Excluded (${model.excludedCount})`;

    container.append(heading, used, includedHeading);
    appendContextList(container, model.included);
    container.append(excludedHeading);
    appendContextList(container, model.excluded);
}
