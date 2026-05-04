export function createChapterEditorState({ volumeOutline = null, chapterOutline = null, scenes = [] } = {}) {
    return { volumeOutline, chapterOutline, scenes };
}
