import TurndownService from 'turndown'
import showdown from 'showdown'

// Configure HTML to Markdown conversion
const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
})

// Configure Markdown to HTML conversion
const showdownConverter = new showdown.Converter({
    tables: true,
    tasklists: true,
    strikethrough: true,
    ghCodeBlocks: true,
    emoji: true,
    underline: true,
    ghMentions: true,
    ghMentionsLink: 'https://github.com/{u}',
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    excludeTrailingPunctuationFromURLs: true,
    literalMidWordUnderscores: true,
    literalMidWordAsterisks: true,
    splitAdjacentBlockquotes: true
})

export function htmlToMarkdown(html) {
    if (!html) return ''
    return turndownService.turndown(html)
}

export function markdownToHtml(markdown) {
    if (!markdown) return ''
    return showdownConverter.makeHtml(markdown)
}