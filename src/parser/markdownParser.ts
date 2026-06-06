import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import sub from 'markdown-it-sub'
import sup from 'markdown-it-sup'

export interface ParserConfig {
  html: boolean
  linkify: boolean
  typographer: boolean
  breaks: boolean
}

export interface ParseResult {
  html: string
  toc: TocEntry[]
}

export interface TocEntry {
  level: number
  text: string
  anchor: string
  position: number
  children: TocEntry[]
}

const DEFAULT_CONFIG: ParserConfig = {
  html: true,
  linkify: true,
  typographer: true,
  breaks: false
}

export function createMarkdownParser(config?: Partial<ParserConfig>) {
  const merged = { ...DEFAULT_CONFIG, ...config }

  const md = new MarkdownIt({
    html: merged.html,
    linkify: merged.linkify,
    typographer: merged.typographer,
    breaks: merged.breaks
  })

  // Register GFM plugins
  md.use(footnote)
  md.use(taskLists, { enabled: true, label: true, labelAfter: true })
  md.use(sub)
  md.use(sup)

  // Custom render rule: add heading-anchor class to headings
  const headingOpenRender = (tokens: MarkIt.Token[], idx: number) => {
    const token = tokens[idx]
    const level = token.tag
    const content = tokens[idx + 1]?.content || ''

    // Generate anchor from heading text
    const anchor = content
      .toLowerCase()
      .replace(/[^\w一-鿿\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `heading-${idx}`

    // Store anchor on the token for later use
    token.attrs = [['id', anchor], ['class', 'heading-anchor']]

    return `<${level} id="${anchor}" class="heading-anchor">`
  }

  md.renderer.rules.heading_open = headingOpenRender

  // Custom link render: open external links in browser
  const defaultLinkOpen = md.renderer.rules.link_open
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrs?.find((a) => a[0] === 'href')?.[1] || ''
    if (href.startsWith('http')) {
      token.attrs = token.attrs || []
      token.attrs.push(['target', '_blank'])
      token.attrs.push(['rel', 'noopener noreferrer'])
    }
    return defaultLinkOpen
      ? defaultLinkOpen(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }

  function getConfig(): ParserConfig {
    return { ...merged }
  }

  function parse(text: string): ParseResult {
    if (!text || !text.trim()) {
      return { html: '', toc: [] }
    }

    const env: { headings?: TocEntry[] } = {}
    const html = md.render(text, env)
    const toc = env.headings || extractToc(text)

    return { html, toc }
  }

  function parseInline(text: string): string {
    return md.renderInline(text)
  }

  return {
    parse,
    parseInline,
    getConfig,
    getMarkdownIt: () => md
  }
}

/**
 * Extract TOC entries from raw markdown text.
 * Used as fallback when env.headings is not populated.
 */
function extractToc(text: string): TocEntry[] {
  const lines = text.split('\n')
  const headings: Array<{ level: number; text: string; position: number }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // ATX headings: # H1, ## H2, etc.
    const atxMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (atxMatch) {
      const rawText = atxMatch[2]
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')

      headings.push({
        level: atxMatch[1].length,
        text: rawText,
        position: i
      })
      continue
    }

    // Setext headings: H1 with ===, H2 with ---
    if (i > 0) {
      const prevLine = lines[i - 1]
      if (prevLine && prevLine.trim() && !prevLine.startsWith('#')) {
        if (/^=+\s*$/.test(line) && prevLine.trim()) {
          headings.push({
            level: 1,
            text: prevLine.replace(/[*`]/g, ''),
            position: i - 1
          })
        } else if (/^-+\s*$/.test(line) && prevLine.trim() && !prevLine.startsWith('- ')) {
          headings.push({
            level: 2,
            text: prevLine.replace(/[*`]/g, ''),
            position: i - 1
          })
        }
      }
    }
  }

  // Build tree structure
  const root: TocEntry[] = []
  const stack: TocEntry[] = []

  for (const h of headings) {
    const anchor = h.text
      .toLowerCase()
      .replace(/[^\w一-鿿\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'heading'

    const item: TocEntry = {
      level: h.level,
      text: h.text,
      anchor,
      position: h.position,
      children: []
    }

    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(item)
    } else {
      stack[stack.length - 1].children.push(item)
    }
    stack.push(item)
  }

  return root
}

export type MarkdownParser = ReturnType<typeof createMarkdownParser>
