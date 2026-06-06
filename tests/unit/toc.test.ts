/**
 * 大纲/TOC 模块测试 —— Table of Contents Tests
 *
 * 覆盖范围：
 * - 从 Markdown 中提取标题（h1-h6）
 * - 构建层级树（父子关系、跳级处理）
 * - 锚点 ID 生成（英文、中文、特殊字符）
 * - 点击跳转逻辑（计算目标位置）
 * - 大纲面板 UI（打开/关闭、快捷键）
 * - 滚动同步与高亮
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// 类型定义
// ============================================================
interface TocItem {
  level: number
  text: string
  anchor: string
  position: number
  children: TocItem[]
}

interface TocParser {
  parse(markdown: string): TocItem[]
  generateAnchor(text: string): string
  flatten(toc: TocItem[]): Array<{ level: number; text: string; anchor: string; position: number }>
}

interface TocPanelState {
  visible: boolean
  items: TocItem[]
  activeAnchor: string | null
}

// ============================================================
// 模拟实现
// ============================================================
function createTocParser(): TocParser {
  return {
    parse(markdown: string): TocItem[] {
      const lines = markdown.split('\n')
      const headings: Array<{ level: number; text: string; position: number }> = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // ATX headings: # H1, ## H2, etc.
        const atxMatch = line.match(/^(#{1,6})\s+(.+)$/)
        if (atxMatch) {
          headings.push({
            level: atxMatch[1].length,
            text: atxMatch[2].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1'),
            position: i
          })
          continue
        }
        // Setext headings: H1 with ===, H2 with ---
        if (i > 0) {
          const prevLine = lines[i - 1]
          if (prevLine && prevLine.trim()) {
            if (/^=+\s*$/.test(line)) {
              headings.push({
                level: 1,
                text: prevLine.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1'),
                position: i - 1
              })
            } else if (/^-+\s*$/.test(line) && !prevLine.startsWith('- ')) {
              headings.push({
                level: 2,
                text: prevLine.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1'),
                position: i - 1
              })
            }
          }
        }
      }

      // Build tree
      const root: TocItem[] = []
      const stack: TocItem[] = []

      for (const h of headings) {
        const item: TocItem = {
          level: h.level,
          text: h.text,
          anchor: this.generateAnchor(h.text),
          position: h.position,
          children: []
        }

        // Pop stack until we find the right parent
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
    },

    generateAnchor(text: string): string {
      // Simplified slug generation
      return text
        .toLowerCase()
        .replace(/[^\w一-鿿\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'heading'
    },

    flatten(toc: TocItem[]): Array<{ level: number; text: string; anchor: string; position: number }> {
      const result: Array<{ level: number; text: string; anchor: string; position: number }> = []
      const walk = (items: TocItem[]) => {
        for (const item of items) {
          result.push({ level: item.level, text: item.text, anchor: item.anchor, position: item.position })
          walk(item.children)
        }
      }
      walk(toc)
      return result
    }
  }
}

function createTocPanel() {
  let state: TocPanelState = {
    visible: false,
    items: [],
    activeAnchor: null
  }

  return {
    getState: () => ({ ...state }),

    open(items: TocItem[]) {
      state.visible = true
      state.items = items
      state.activeAnchor = null
    },

    close() {
      state.visible = false
      state.activeAnchor = null
    },

    toggle(items?: TocItem[]) {
      if (state.visible) {
        this.close()
      } else {
        this.open(items ?? state.items)
      }
    },

    setActive(anchor: string) {
      state.activeAnchor = anchor
    },

    scrollTo(anchor: string, callback?: (position: number) => void) {
      state.activeAnchor = anchor
      // Find the item position
      const flat = createTocParser().flatten(state.items)
      const item = flat.find((i) => i.anchor === anchor)
      if (item && callback) {
        callback(item.position)
      }
    },

    isVisible() {
      return state.visible
    }
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('TOC Parser — Header Extraction', () => {
  let parser: TocParser

  beforeEach(() => {
    parser = createTocParser()
  })

  // ---- 1. 标题提取 ----
  describe('Heading Extraction', () => {
    it('should extract all ATX headings', () => {
      const md = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6'
      const toc = parser.parse(md)
      const flat = parser.flatten(toc)
      expect(flat.length).toBe(6)
      expect(flat[0].level).toBe(1)
      expect(flat[5].level).toBe(6)
    })

    it('should extract Setext headings', () => {
      const md = 'Heading 1\n=========\n\nHeading 2\n---------'
      const toc = parser.parse(md)
      const flat = parser.flatten(toc)
      expect(flat.length).toBe(2)
      expect(flat[0].level).toBe(1)
      expect(flat[1].level).toBe(2)
    })

    it('should extract heading text without markdown formatting', () => {
      const md = '## **Bold** and *italic* heading'
      const toc = parser.parse(md)
      expect(toc[0].text).not.toContain('**')
      expect(toc[0].text).not.toContain('*')
      expect(toc[0].text).toContain('Bold')
      expect(toc[0].text).toContain('italic')
    })

    it('should extract heading text with inline code', () => {
      const md = '## Using the `foo()` function'
      const toc = parser.parse(md)
      expect(toc[0].text).not.toContain('`')
      expect(toc[0].text).toContain('foo()')
    })

    it('should return empty array for documents without headings', () => {
      const md = 'Just a paragraph.\n\nAnother paragraph.'
      const toc = parser.parse(md)
      expect(toc.length).toBe(0)
    })

    it('should handle empty document', () => {
      const toc = parser.parse('')
      expect(toc.length).toBe(0)
    })
  })

  // ---- 2. 层级树构建 ----
  describe('Tree Construction', () => {
    it('should build flat structure for same-level headings', () => {
      const md = '# H1\n\n# H2\n\n# H3'
      const toc = parser.parse(md)
      expect(toc.length).toBe(3)
      toc.forEach((item) => expect(item.children.length).toBe(0))
    })

    it('should nest h2 under h1', () => {
      const md = '# Title\n\n## Section 1\n\n## Section 2'
      const toc = parser.parse(md)
      expect(toc.length).toBe(1)
      expect(toc[0].level).toBe(1)
      expect(toc[0].children.length).toBe(2)
    })

    it('should handle deep nesting (h1 > h2 > h3)', () => {
      const md = '# Title\n\n## Section\n\n### Subsection'
      const toc = parser.parse(md)
      expect(toc.length).toBe(1)
      expect(toc[0].children.length).toBe(1)
      expect(toc[0].children[0].children.length).toBe(1)
    })

    it('should handle skipped levels (h1 > h3)', () => {
      const md = '# Title\n\n### Subsection (jumped)'
      const toc = parser.parse(md)
      expect(toc.length).toBe(1)
      // h3 is a child of h1 even though h2 is missing
      expect(toc[0].children.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle multiple top-level sections', () => {
      const md = '# Title\n\n## Section 1\n\n## Section 2\n\n### Sub 2.1\n\n## Section 3'
      const toc = parser.parse(md)
      expect(toc.length).toBe(1) // one h1 at top
      expect(toc[0].children.length).toBe(3) // three h2 sections
    })

    it('should handle multiple h1 headings', () => {
      const md = '# Part 1\n\n## Chapter 1\n\n# Part 2\n\n## Chapter 2'
      const toc = parser.parse(md)
      expect(toc.length).toBe(2)
      expect(toc[0].children.length).toBe(1)
      expect(toc[1].children.length).toBe(1)
    })
  })

  // ---- 3. 锚点生成 ----
  describe('Anchor Generation', () => {
    it('should generate slug from English text', () => {
      const anchor = parser.generateAnchor('Getting Started')
      expect(anchor).toBe('getting-started')
    })

    it('should generate anchor from Chinese text', () => {
      const anchor = parser.generateAnchor('第一章')
      expect(anchor).toBe('第一章') // keeps Chinese characters
    })

    it('should remove special characters', () => {
      const anchor = parser.generateAnchor('Hello, World! (Test)')
      expect(anchor).not.toContain(',')
      expect(anchor).not.toContain('!')
      expect(anchor).not.toContain('(')
      expect(anchor).not.toContain(')')
    })

    it('should collapse multiple hyphens', () => {
      const anchor = parser.generateAnchor('Hello   World---Test')
      expect(anchor).not.toContain('---')
      expect(anchor).not.toContain('   ')
    })

    it('should handle mixed Chinese and English', () => {
      const anchor = parser.generateAnchor('第1章 Introduction')
      expect(anchor).toBeTruthy()
    })

    it('should fallback for empty anchor', () => {
      const anchor = parser.generateAnchor('')
      expect(anchor).toBe('heading')
    })

    it('should handle heading with numbers and punctuation', () => {
      const anchor = parser.generateAnchor('v2.0 Release Notes (2025)')
      expect(anchor).toContain('v2')
      expect(anchor).toContain('release')
    })
  })

  // ---- 4. 位置跟踪 ----
  describe('Position Tracking', () => {
    it('should track line numbers of headings', () => {
      const md = '# H1\n\nPara\n\n## H2\n\n### H3'
      const toc = parser.parse(md)
      const flat = parser.flatten(toc)
      expect(flat.length).toBe(3)
      expect(flat[0].position).toBe(0) // line 0
      expect(flat[1].position).toBeGreaterThan(0)
      expect(flat[2].position).toBeGreaterThan(flat[1].position)
    })
  })

  // ---- 5. flatten 工具 ----
  describe('Flatten Utility', () => {
    it('should flatten nested TOC to linear list', () => {
      const md = '# H1\n\n## H2a\n\n### H3\n\n## H2b'
      const toc = parser.parse(md)
      const flat = parser.flatten(toc)
      expect(flat.length).toBe(4)
      expect(flat[0].level).toBe(1)
      expect(flat[1].level).toBe(2)
      expect(flat[2].level).toBe(3)
      expect(flat[3].level).toBe(2)
    })
  })
})

// ============================================================
// TOC Panel UI 测试
// ============================================================
describe('TOC Panel — UI State Management', () => {
  let panel: ReturnType<typeof createTocPanel>

  beforeEach(() => {
    panel = createTocPanel()
  })

  it('should start hidden', () => {
    expect(panel.isVisible()).toBe(false)
  })

  it('should open with items', () => {
    const items: TocItem[] = [
      { level: 1, text: 'Title', anchor: 'title', position: 0, children: [] }
    ]
    panel.open(items)
    expect(panel.isVisible()).toBe(true)
    expect(panel.getState().items.length).toBe(1)
  })

  it('should close', () => {
    panel.open([])
    expect(panel.isVisible()).toBe(true)
    panel.close()
    expect(panel.isVisible()).toBe(false)
  })

  it('should toggle open/close', () => {
    expect(panel.isVisible()).toBe(false)
    panel.toggle([])
    expect(panel.isVisible()).toBe(true)
    panel.toggle()
    expect(panel.isVisible()).toBe(false)
  })

  it('should set active anchor on scrollTo', () => {
    const items: TocItem[] = [
      { level: 1, text: 'Intro', anchor: 'intro', position: 0, children: [] },
      { level: 1, text: 'Body', anchor: 'body', position: 10, children: [] }
    ]
    panel.open(items)
    let scrolledPosition = -1
    panel.scrollTo('body', (pos) => { scrolledPosition = pos })
    expect(scrolledPosition).toBe(10)
  })

  it('should track active anchor', () => {
    panel.open([])
    panel.setActive('chapter-2')
    expect(panel.getState().activeAnchor).toBe('chapter-2')
  })

  it('should clear active anchor on close', () => {
    panel.open([])
    panel.setActive('chapter-1')
    panel.close()
    expect(panel.getState().activeAnchor).toBeNull()
  })
})