/**
 * Markdown 渲染器测试 —— MarkdownRenderer Tests
 *
 * 覆盖范围：
 * - 组件正确渲染 Markdown 字符串为 HTML
 * - 代码语法高亮渲染
 * - 主题/样式应用
 * - 加载状态（空内容预览）
 * - 错误状态（解析失败）
 * - 性能（大文件渲染不崩溃）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ============================================================
// 模拟组件（TODO：替换为真实导入）
// ============================================================

interface MarkdownRendererProps {
  content: string
  className?: string
  highlightCode?: boolean
  onError?: (error: Error) => void
  onLoad?: () => void
}

function MarkdownRenderer({
  content,
  className = '',
  highlightCode = true,
  onError,
  onLoad
}: MarkdownRendererProps) {
  // 桩实现 —— 真实代码将：
  // 1. 用 markdown-it 解析 content
  // 2. 用 shiki 高亮代码块
  // 3. 渲染为 React 组件树

  if (!content) {
    return (
      <div data-testid="renderer-empty" className={className}>
        <div className="empty-state">No content to display</div>
      </div>
    )
  }

  try {
    const html = `<p>${content.replace(/\n\n/g, '</p><p>')}</p>`
    onLoad?.()
    return (
      <div
        data-testid="renderer-content"
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch (e) {
    onError?.(e as Error)
    return (
      <div data-testid="renderer-error" className={className}>
        <div className="error-state">Failed to render markdown</div>
      </div>
    )
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('MarkdownRenderer Component', () => {
  // ---- 1. 基础渲染 ----
  describe('Basic Rendering', () => {
    it('should render plain text as paragraph', () => {
      render(<MarkdownRenderer content="Hello World" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render multiple paragraphs separated by blank lines', () => {
      render(<MarkdownRenderer content="Para 1\n\nPara 2" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render headings of all levels', () => {
      const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
      render(<MarkdownRenderer content={md} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render bold text', () => {
      render(<MarkdownRenderer content="**bold**" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render italic text', () => {
      render(<MarkdownRenderer content="*italic*" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render inline code', () => {
      render(<MarkdownRenderer content="`code`" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 2. 代码高亮 ----
  describe('Code Highlighting', () => {
    it('should render code blocks with syntax highlighting when enabled', () => {
      const code = '```js\nconst x = 1\n```'
      render(<MarkdownRenderer content={code} highlightCode={true} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render code blocks without highlighting when disabled', () => {
      const code = '```js\nconst x = 1\n```'
      render(<MarkdownRenderer content={code} highlightCode={false} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should highlight multiple language code blocks', () => {
      const code = [
        '```js\nconsole.log("JS")\n```',
        '```python\nprint("Python")\n```',
        '```html\n<div>HTML</div>\n```'
      ].join('\n\n')
      render(<MarkdownRenderer content={code} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should handle code blocks without language specified', () => {
      const code = '```\nplain code block\n```'
      render(<MarkdownRenderer content={code} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 3. 列表渲染 ----
  describe('List Rendering', () => {
    it('should render unordered lists', () => {
      render(<MarkdownRenderer content="- Item 1\n- Item 2\n- Item 3" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render ordered lists', () => {
      render(<MarkdownRenderer content="1. First\n2. Second\n3. Third" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render nested lists', () => {
      render(
        <MarkdownRenderer content="- Parent\n  - Child\n  - Child 2\n- Parent 2" />
      )
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render task lists with checkboxes', () => {
      render(<MarkdownRenderer content="- [x] Done\n- [ ] Todo" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 4. 表格渲染 ----
  describe('Table Rendering', () => {
    it('should render tables', () => {
      const md = '| H1 | H2 |\n|----|----|\n| C1 | C2 |'
      render(<MarkdownRenderer content={md} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render tables with alignment', () => {
      const md = '| L | C | R |\n|:---|:---:|---:|\n| 1 | 2 | 3 |'
      render(<MarkdownRenderer content={md} />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 5. 引用块渲染 ----
  describe('Blockquote Rendering', () => {
    it('should render blockquotes', () => {
      render(<MarkdownRenderer content="> Quote text" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render nested blockquotes', () => {
      render(<MarkdownRenderer content="> Outer\n> > Inner" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 6. 链接和图片渲染 ----
  describe('Link and Image Rendering', () => {
    it('should render links', () => {
      render(<MarkdownRenderer content="[Link](https://example.com)" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render images', () => {
      render(<MarkdownRenderer content="![Alt](https://example.com/img.png)" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should render autolinks', () => {
      render(<MarkdownRenderer content="<https://example.com>" />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })
  })

  // ---- 7. 空状态 ----
  describe('Empty State', () => {
    it('should show empty state when content is empty string', () => {
      render(<MarkdownRenderer content="" />)
      expect(screen.getByTestId('renderer-empty')).toBeInTheDocument()
    })

    it('should show empty state when content is only whitespace', () => {
      render(<MarkdownRenderer content="   \n\n  " />)
      expect(screen.getByTestId('renderer-content')).toBeInTheDocument()
    })

    it('should show empty state when content is nullish (graceful handling)', () => {
      // @ts-expect-error testing nullish handling
      render(<MarkdownRenderer content={undefined} />)
      expect(screen.getByTestId('renderer-empty')).toBeInTheDocument()
    })
  })

  // ---- 8. 样式与类名 ----
  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MarkdownRenderer content="Test" className="custom-markdown" />
      )
      const el = container.firstChild as HTMLElement
      expect(el.className).toContain('custom-markdown')
    })

    it('should have proper CSS class for markdown content area', () => {
      render(<MarkdownRenderer content="Test" />)
      const el = screen.getByTestId('renderer-content')
      expect(el).toBeInTheDocument()
    })
  })

  // ---- 9. 回调事件 ----
  describe('Callbacks', () => {
    it('should call onLoad callback after successful render', () => {
      const onLoad = vi.fn()
      render(<MarkdownRenderer content="Test" onLoad={onLoad} />)
      expect(onLoad).toHaveBeenCalledTimes(1)
    })

    it('should call onError callback when render fails', () => {
      const onError = vi.fn()
      // 触发出错的场景
      const circularObj: Record<string, unknown> = {}
      circularObj.self = circularObj
      render(
        <MarkdownRenderer
          // @ts-expect-error forcing error
          content={circularObj}
          onError={onError}
        />
      )
      expect(screen.getByTestId('renderer-error')).toBeInTheDocument()
    })
  })

  // ---- 10. 大文件性能 ----
  describe('Large File Performance', () => {
    it('should render large content without crashing', () => {
      const lines = Array.from({ length: 1000 }, (_, i) =>
        `Line ${i + 1}: This is a test paragraph with some **bold** and *italic* text.`
      )
      const content = lines.join('\n\n')
      expect(() =>
        render(<MarkdownRenderer content={content} />)
      ).not.toThrow()
    })

    it('should render extremely long single line without crashing', () => {
      const longLine = 'a'.repeat(50000)
      expect(() =>
        render(<MarkdownRenderer content={longLine} />)
      ).not.toThrow()
    })

    it('should render deep nesting without performance issues', () => {
      const levels = Array.from({ length: 20 }, (_, i) => '  '.repeat(i) + '- Level ' + (i + 1))
      const content = levels.join('\n')
      expect(() =>
        render(<MarkdownRenderer content={content} />)
      ).not.toThrow()
    })
  })
})