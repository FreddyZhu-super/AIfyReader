import { createHighlighter, type HighlighterCore } from 'shiki'

export interface HighlightResult {
  html: string
  language: string
  meta: {
    lines: number
    theme: string
  }
}

export interface HighlighterConfig {
  theme?: string
  defaultLanguage?: string
}

type ThemeName = 'github-light' | 'github-dark' | 'one-dark-pro' | 'one-light' | 'material-theme'

let highlighterInstance: HighlighterCore | null = null
let currentTheme: ThemeName = 'github-light'

const THEME_MAP: Record<string, ThemeName> = {
  'github-light': 'github-light',
  'github-dark': 'github-dark',
  'one-dark-pro': 'one-dark-pro',
  'one-light': 'one-light',
  'material-theme': 'material-theme'
}

/**
 * Initialize the shiki highlighter (lazy init)
 */
async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-light', 'github-dark', 'one-dark-pro', 'one-light', 'material-theme'],
      langs: [
        'javascript', 'typescript', 'jsx', 'tsx',
        'python', 'html', 'css', 'json', 'yaml',
        'bash', 'shell', 'sql', 'rust', 'go',
        'java', 'kotlin', 'swift', 'php', 'ruby',
        'cpp', 'c', 'csharp',
        'markdown', 'xml', 'dockerfile', 'diff',
        'graphql', 'handlebars', 'ini', 'latex',
        'less', 'lua', 'makefile', 'perl',
        'powershell', 'scss', 'sass', 'scala',
        'toml', 'vue', 'wasm', 'text'
      ]
    })
  }
  return highlighterInstance
}

/**
 * Highlight code with shiki
 */
export async function highlightCode(
  code: string,
  language: string,
  theme?: string
): Promise<HighlightResult> {
  const hl = await getHighlighter()
  const resolvedTheme = theme ? (THEME_MAP[theme] || currentTheme) : currentTheme
  const resolvedLang = language || 'text'

  try {
    const html = hl.codeToHtml(code, {
      lang: resolvedLang,
      theme: resolvedTheme
    })

    return {
      html,
      language: resolvedLang,
      meta: {
        lines: code.split('\n').length,
        theme: resolvedTheme
      }
    }
  } catch {
    // Fallback: if language is not supported, use plain text
    const html = hl.codeToHtml(code, {
      lang: 'text',
      theme: resolvedTheme
    })

    return {
      html,
      language: 'text',
      meta: {
        lines: code.split('\n').length,
        theme: resolvedTheme
      }
    }
  }
}

/**
 * Set the active theme
 */
export function setHighlighterTheme(theme: string): void {
  if (THEME_MAP[theme]) {
    currentTheme = THEME_MAP[theme]
  }
}

/**
 * Get available themes
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEME_MAP)
}

/**
 * Get loaded languages
 */
export function getLoadedLanguages(): string[] {
  if (!highlighterInstance) return ['text']
  return highlighterInstance.getLoadedLanguages() as string[]
}
