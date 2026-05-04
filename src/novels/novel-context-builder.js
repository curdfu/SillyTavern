export function buildNovelContext({ required = [], candidates = [], budget = 0 } = {}) {
    const included = required.map(text => ({ id: text, tokens: text.length, reason: 'required' }));
    const excluded = [];
    const includedIds = new Set(included.map(item => item.id));
    let used = included.reduce((sum, item) => sum + item.tokens, 0);

    for (const candidate of candidates) {
        const tokens = candidate.tokens ?? 0;

        if (!includedIds.has(candidate.id) && used + tokens <= budget) {
            included.push({ ...candidate, tokens, reason: 'selected' });
            includedIds.add(candidate.id);
            used += tokens;
        } else {
            excluded.push({ ...candidate, tokens, reason: 'over-budget' });
        }
    }

    return { included, excluded, used };
}
