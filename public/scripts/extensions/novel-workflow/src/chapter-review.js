export function createChapterReviewState({ status = 'pending', notes = [] } = {}) {
    return { status, notes };
}
