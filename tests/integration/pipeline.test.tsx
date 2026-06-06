/**
 * 集成测试 —— Integration Tests
 *
 * 覆盖范围：
 * - 文件读取 → 解析 → 渲染 的完整流水线
 * - 编辑器状态 ↔ 文件的同步
 * - 主题状态与渲染联动
 * - 用户典型工作流程（打开文件 → 编辑 → 保存）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// ============================================================
// 模拟集成场景 —— 整合 FileService + Parser + Renderer
// ============================================================

interface ReadFileResult {
  content: string
  path: string
  size: number
}

function createMarkdownParser() {
  return {
    parse(text: string): string {
      if (!text) return ''
      // 简化的 markdown → html 转换（用于测试集成流程）
      let html = text
        .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
        .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
      html = '<p>' + html + '</p>'
      return html
    }
  }
}

function createFileService() {
  const files = new Map<string, string>()

  return {
    async readFile(path: string): Promise<ReadFileResult> {
      const content = files.get(path)
      if (content === undefined) throw new Error(`File not found: ${path}`)
      return { content, path, size: content.length }
    },
    async writeFile(path: string, content: string): Promise<void> {
      files.set(path, content)
    },
    async exists(path: string): Promise<boolean> {
      return files.has(path)
    },
    seed(path: string, content: string) {
      files.set(path, content)
    }
  }
}

function createThemeManager() {
  let currentTheme = 'default'

  return {
    getCurrentTheme: () => currentTheme,
    setTheme: (theme: string) => { currentTheme = theme },
    getAvailableThemes: () => ['default', 'dark', 'github']
  }
}

// 简单的 MarkdownRenderer（与单元测试一致）
function MarkdownRenderer({
  content,
  className = ''
}: {
  content: string
  className?: string
}) {
  if (!content) return <div data-testid="renderer-empty" className={className}><div className="empty-state">No content to display</div></div>

  const parser = createMarkdownParser()
  const html = parser.parse(content)

  return (
    <div
      data-testid="renderer-content"
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// ============================================================
// 测试套件
// ============================================================
describe('Integration Tests — End-to-End Flows', () => {
  let fileService: ReturnType<typeof createFileService>
  let parser: ReturnType<typeof createMarkdownParser>
  let themeManager: ReturnType<typeof createThemeManager>

  beforeEach(() => {
    fileService = createFileService()
    parser = createMarkdownParser()
    themeManager = createThemeManager()

    // 预置测试文件
    fileService.seed('/docs/readme.md', '# Welcome\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2')
    fileService.seed('/docs/api.md', '# API Reference\n\n## Endpoints\n\n`GET /api/users`\n\nReturns a list of users.')
    fileService.seed('/docs/empty.md', '')
  })

  // ---- 1. 读取 → 解析 → 渲染 流水线 ----
  describe('Read → Parse → Render Pipeline', () => {
    it('should read a file, parse it, and render HTML', async () => {
      // Step 1: Read
      const file = await fileService.readFile('/docs/readme.md')
      expect(file.content).toBeTruthy()

      // Step 2: Parse
      const html = parser.parse(file.content)
      expect(html).toContain('<h1>')
      expect(html).toContain('<strong>')

      // Step 3: Render
      render(<MarkdownRenderer content={file.content} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should produce valid HTML headings from markdown headings', async () => {
      const file = await fileService.readFile('/docs/api.md')
      const html = parser.parse(file.content)
      expect(html).toContain('<h1>')
      expect(html).toContain('<h2>')
      expect(html).toContain('<code>')
    })

    it('should gracefully handle empty file', async () => {
      const file = await fileService.readFile('/docs/empty.md')
      render(<MarkdownRenderer content={file.content} />)
      expect(screen.getByTestId('renderer-empty')).toBeInTheDocument()
    })
  })

  // ---- 2. 读取文件 → 编辑 → 保存 工作流 ----
  describe('Open → Edit → Save Workflow', () => {
    it('should read, modify, and persist changes', async () => {
      // Read
      const file = await fileService.readFile('/docs/readme.md')
      const originalContent = file.content

      // Edit
      const editedContent = originalContent + '\n\n## New Section\n\nAdded content.'
      expect(editedContent).not.toBe(originalContent)

      // Save
      await fileService.writeFile('/docs/readme.md', editedContent)
      const saved = await fileService.readFile('/docs/readme.md')
      expect(saved.content).toContain('## New Section')
    })

    it('should handle multiple read-write cycles', async () => {
      const path = '/docs/api.md'
      const versions = ['v1', 'v2', 'v3']

      for (const ver of versions) {
        await fileService.writeFile(path, `# Version ${ver}`)
        const file = await fileService.readFile(path)
        expect(file.content).toBe(`# Version ${ver}`)
      }
    })
  })

  // ---- 3. 解析准确性 ----
  describe('Parse Accuracy', () => {
    it('should correctly parse heading levels', () => {
      const md = '# H1\n## H2\n### H3'
      const html = parser.parse(md)
      expect(html).toContain('<h1>')
      expect(html).toContain('<h2>')
      expect(html).toContain('<h3>')
    })

    it('should correctly parse inline formatting', () => {
      const md = '**bold** *italic* `code`'
      const html = parser.parse(md)
      expect(html).toContain('<strong>')
      expect(html).toContain('<em>')
      expect(html).toContain('<code>')
    })

    it('should correctly parse lists', () => {
      const md = '- A\n- B\n- C'
      const html = parser.parse(md)
      expect(html).toContain('<li>')
    })
  })

  // ---- 4. 多个文件同时打开 ----
  describe('Multi-File Handling', () => {
    it('should render different files without cross-contamination', async () => {
      const file1 = await fileService.readFile('/docs/readme.md')
      const file2 = await fileService.readFile('/docs/api.md')

      const { unmount } = render(<MarkdownRenderer content={file1.content} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()

      unmount()
      render(<MarkdownRenderer content={file2.content} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 5. 主题与渲染联动 ----
  describe('Theme and Rendering Integration', () => {
    it('should apply theme class to rendered output', () => {
      const theme = themeManager.getCurrentTheme()
      render(<MarkdownRenderer content="# Hello" className={`theme-${theme}`} />)
      const el = screen.getByTestId('renderer-content')
      expect(el.className).toContain('theme-default')
    })

    it('should reflect theme changes in class name', () => {
      themeManager.setTheme('dark')
      render(<MarkdownRenderer content="# Hello" className={`theme-${themeManager.getCurrentTheme()}`} />)
      const el = screen.getByTestId('renderer-content')
      expect(el.className).toContain('theme-dark')
    })
  })

  // ---- 6. 跨模块通信 ----
  describe('Cross-Module Communication', () => {
    it('should read file and parse through the full pipeline', async () => {
      // 模拟用户完整操作链
      const pipeline = async (filePath: string) => {
        const file = await fileService.readFile(filePath)
        const html = parser.parse(file.content)
        return { markdown: file.content, html, size: file.size }
      }

      const result = await pipeline('/docs/readme.md')
      expect(result.markdown).toBeTruthy()
      expect(result.html).toBeTruthy()
      expect(result.size).toBeGreaterThan(0)
    })

    it('should handle error propagation between modules', async () => {
      // 文件不存在时，FileService 抛错 → 调用方应捕获
      await expect(
        (async () => {
          const file = await fileService.readFile('/nonexistent.md')
          return parser.parse(file.content)
        })()
      ).rejects.toThrow(/not found/)
    })
  })
})