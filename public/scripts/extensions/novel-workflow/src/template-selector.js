const outlineTemplates = [
    {
        id: 'growth-progression',
        name: '升级流/成长流',
        genres: ['玄幻', '仙侠', '异能'],
        keywords: ['升级', '突破', '成长'],
    },
    {
        id: 'multi-thread',
        name: '多线并进流',
        genres: ['群像', '史诗', '战争'],
        keywords: ['多线', '群像', '并进'],
    },
];

/**
 * @param {{ genre?: string, keywords?: string[] }} [options]
 * @returns {string[]}
 */
export function recommendTemplates({ genre = '', keywords = [] } = {}) {
    const matches = outlineTemplates.filter(template => {
        return template.genres.some(templateGenre => genre.includes(templateGenre))
            || template.keywords.some(keyword => keywords.includes(keyword));
    });

    return (matches.length > 0 ? matches : outlineTemplates).map(template => template.name);
}
