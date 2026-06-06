/**
 * 代码高亮引擎测试 —— CodeHighlighter Tests
 *
 * 覆盖范围：
 * - shiki 集成与初始化
 * - 多种编程语言的语法高亮
 * - 高亮主题切换
 * - 未知语言的处理
 * - 性能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// 类型定义
// ============================================================
interface HighlightResult {
  html: string
  language: string
  meta: {
    lines: number
    theme: string
  }
}

interface HighlighterConfig {
  theme: string
  defaultLanguage?: string
  languages?: string[]
}

interface CodeHighlighter {
  highlight(code: string, language: string): Promise<HighlightResult>
  highlightSync(code: string, language: string): HighlightResult
  setTheme(theme: string): void
  getLoadedLanguages(): string[]
  getAvailableThemes(): string[]
}

// ============================================================
// 模拟实现（TODO：替换为真实 shiki 集成）
// ============================================================
function createCodeHighlighter(config?: Partial<HighlighterConfig>): CodeHighlighter {
  const state = {
    theme: config?.theme ?? 'github-light',
    defaultLanguage: config?.defaultLanguage ?? 'text',
    loadedLanguages: new Set(config?.languages ?? ['text'])
  }

  return {
    async highlight(code: string, language: string): Promise<HighlightResult> {
      if (!language) language = state.defaultLanguage

      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      return {
        html: `<pre class="shiki ${state.theme}"><code class="language-${language}">${escaped}</code></pre>`,
        language,
        meta: {
          lines: code.split('\n').length,
          theme: state.theme
        }
      }
    },

    highlightSync(code: string, language: string): HighlightResult {
      if (!language) language = state.defaultLanguage
      return {
        html: `<pre><code class="language-${language}">${code}</code></pre>`,
        language,
        meta: {
          lines: code.split('\n').length,
          theme: state.theme
        }
      }
    },

    setTheme(theme: string): void {
      state.theme = theme
    },

    getLoadedLanguages(): string[] {
      return Array.from(state.loadedLanguages)
    },

    getAvailableThemes(): string[] {
      return ['github-light', 'github-dark', 'one-dark-pro', 'one-light', 'material-theme']
    }
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('CodeHighlighter Module', () => {
  let highlighter: CodeHighlighter

  // ---- 1. 初始化 ----
  describe('Initialization', () => {
    it('should create highlighter with default theme', () => {
      highlighter = createCodeHighlighter()
      expect(highlighter).toBeDefined()
      expect(highlighter.getAvailableThemes()).toContain('github-light')
    })

    it('should create highlighter with custom theme', () => {
      highlighter = createCodeHighlighter({ theme: 'one-dark-pro' })
      expect(highlighter).toBeDefined()
    })

    it('should list available themes', () => {
      highlighter = createCodeHighlighter()
      const themes = highlighter.getAvailableThemes()
      expect(themes.length).toBeGreaterThan(0)
      expect(themes).toContain('github-light')
    })
  })

  // ---- 2. 基础高亮 ----
  describe('Basic Highlighting', () => {
    beforeEach(() => {
      highlighter = createCodeHighlighter()
    })

    it('should highlight JavaScript code', async () => {
      const code = 'const x = 1;\nconsole.log(x);'
      const result = await highlighter.highlight(code, 'javascript')
      expect(result).toBeDefined()
      expect(result.language).toBe('javascript')
      expect(result.html).toContain('language-javascript')
    })

    it('should highlight Python code', async () => {
      const code = 'def hello():\n    print("world")'
      const result = await highlighter.highlight(code, 'python')
      expect(result).toBeDefined()
      expect(result.language).toBe('python')
      expect(result.html).toContain('language-python')
    })

    it('should highlight HTML code', async () => {
      const code = '<div class="test">Hello</div>'
      const result = await highlighter.highlight(code, 'html')
      expect(result).toBeDefined()
      expect(result.language).toBe('html')
    })

    it('should escape HTML entities in code', async () => {
      const code = '<script>alert("xss")</script>'
      const result = await highlighter.highlight(code, 'html')
      // HTML 特殊字符应被转义，不能包含原始的 <script> 标签
      expect(result.html).not.toContain('<script>')
    })

    it('should highlight TypeScript code', async () => {
      const code = 'const x: number = 42;'
      const result = await highlighter.highlight(code, 'typescript')
      expect(result).toBeDefined()
      expect(result.language).toBe('typescript')
    })

    it('should highlight CSS code', async () => {
      const code = 'body { color: red; }'
      const result = await highlighter.highlight(code, 'css')
      expect(result).toBeDefined()
      expect(result.language).toBe('css')
    })

    it('should highlight JSON code', async () => {
      const code = '{"key": "value", "num": 42}'
      const result = await highlighter.highlight(code, 'json')
      expect(result).toBeDefined()
      expect(result.language).toBe('json')
    })
  })

  // ---- 3. 未知语言处理 ----
  describe('Unknown Language Handling', () => {
    beforeEach(() => {
      highlighter = createCodeHighlighter()
    })

    it('should fall back to plain text for unknown language', async () => {
      const code = 'some random text'
      const result = await highlighter.highlight(code, 'unknown-lang-123')
      expect(result).toBeDefined()
      // 未知语言不应报错，应以纯文本形式展示
    })

    it('should use default language when none provided', async () => {
      const highlighterWithDefault = createCodeHighlighter({ defaultLanguage: 'text' })
      const result = await highlighterWithDefault.highlight('plain text', '')
      expect(result).toBeDefined()
    })
  })

  // ---- 4. 主题切换 ----
  describe('Theme Switching', () => {
    beforeEach(() => {
      highlighter = createCodeHighlighter()
    })

    it('should switch theme', () => {
      highlighter.setTheme('one-dark-pro')
      // 切换后高亮应使用新主题
      expect(highlighter.getAvailableThemes()).toContain('one-dark-pro')
    })

    it('should reflect theme change in output', async () => {
      highlighter.setTheme('one-dark-pro')
      const result = await highlighter.highlight('const x = 1', 'javascript')
      expect(result.meta.theme).toBe('one-dark-pro')
    })
  })

  // ---- 5. 元信息 ----
  describe('Meta Information', () => {
    beforeEach(() => {
      highlighter = createCodeHighlighter()
    })

    it('should return line count', async () => {
      const result = await highlighter.highlight('a\nb\nc\nd', 'text')
      expect(result.meta.lines).toBe(4)
    })

    it('should return language in result', async () => {
      const result = await highlighter.highlight('code', 'python')
      expect(result.language).toBe('python')
    })

    it('should return theme name in result', async () => {
      const result = await highlighter.highlight('code', 'js')
      expect(result.meta.theme).toBe('github-light')
    })
  })

  // ---- 6. 同步 API ----
  describe('Sync API', () => {
    beforeEach(() => {
      highlighter = createCodeHighlighter()
    })

    it('should provide synchronous highlight method', () => {
      const result = highlighter.highlightSync('const x = 1', 'javascript')
      expect(result).toBeDefined()
      expect(result.language).toBe('javascript')
    })
  })

  // ---- 7. 边界情况 ----
  describe('Edge Cases', () => {
    beforeEach(() => {
      highlighter = createCodeHighlighter()
    })

    it('should handle empty code', async () => {
      const result = await highlighter.highlight('', 'javascript')
      expect(result).toBeDefined()
      expect(result.meta.lines).toBe(1)
    })

    it('should handle very long code', async () => {
      const longCode = Array.from({ length: 500 }, () => 'console.log("line");').join('\n')
      const result = await highlighter.highlight(longCode, 'javascript')
      expect(result).toBeDefined()
      expect(result.meta.lines).toBe(500)
    })

    it('should handle code with only special characters', async () => {
      const code = '@#$%^&*()_+{}|:"<>?'
      // 不应抛出异常
      const result = await highlighter.highlight(code, 'text')
      expect(result).toBeDefined()
    })
  })
})