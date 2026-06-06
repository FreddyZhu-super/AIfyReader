/**
 * 文件夹浏览模式测试 —— Folder Browser Tests
 *
 * 覆盖范围：
 * - 打开文件夹并加载文件树
 * - 文件树只显示支持的 Markdown 扩展名
 * - 隐藏非 Markdown 文件
 * - 点击文件渲染内容（只读模式）
 * - 双击文件切换到编辑模式
 * - 文件树的展开/折叠
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// 类型定义
// ============================================================
interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  extension?: string
}

type ViewMode = 'browser' | 'editor'

interface BrowserState {
  currentFolder: string | null
  files: FileEntry[]
  selectedFilePath: string | null
  viewMode: ViewMode
  expandedPaths: Set<string>
}

// ============================================================
// 模拟实现
// ============================================================
const SUPPORTED_EXTENSIONS = ['.md', '.mdx', '.markdown', '.mdown', '.mkd']

function isSupportedFile(name: string): boolean {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(ext)
}

function isHiddenFile(name: string): boolean {
  return name.startsWith('.')
}

function createBrowserStore() {
  const state: BrowserState = {
    currentFolder: null,
    files: [],
    selectedFilePath: null,
    viewMode: 'browser',
    expandedPaths: new Set<string>()
  }

  return {
    getState: (): BrowserState => ({ ...state, expandedPaths: new Set(state.expandedPaths) }),

    setFolder(folderPath: string, files: FileEntry[]) {
      state.currentFolder = folderPath
      state.files = files
      state.selectedFilePath = null
    },

    /**
     * 从完整文件列表中过滤出支持的 Markdown 文件
     */
    getMarkdownFiles(): FileEntry[] {
      return state.files.filter((f) => f.type === 'file' && isSupportedFile(f.name))
    },

    /**
     * 获取所有目录（保留非 Markdown 目录下的有效文件）
     */
    getDisplayableFiles(): FileEntry[] {
      return state.files.filter((f) => {
        if (f.type === 'directory') return !isHiddenFile(f.name)
        return isSupportedFile(f.name)
      })
    },

    selectFile(filePath: string) {
      state.selectedFilePath = filePath
      state.viewMode = 'browser' // stays in browser mode on single click
    },

    openFileForEditing(filePath: string) {
      state.selectedFilePath = filePath
      state.viewMode = 'editor'
    },

    isSupportedExtension(extension: string): boolean {
      return SUPPORTED_EXTENSIONS.includes(extension.toLowerCase())
    },

    toggleExpand(path: string) {
      const newSet = new Set(state.expandedPaths)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      state.expandedPaths = newSet
    },

    isExpanded(path: string): boolean {
      return state.expandedPaths.has(path)
    }
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('Folder Browser — File Tree & Extension Filtering', () => {
  let browser: ReturnType<typeof createBrowserStore>
  const mockFiles: FileEntry[] = [
    { name: 'readme.md', path: '/docs/readme.md', type: 'file', extension: '.md' },
    { name: 'guide.markdown', path: '/docs/guide.markdown', type: 'file', extension: '.markdown' },
    { name: 'component.mdx', path: '/docs/component.mdx', type: 'file', extension: '.mdx' },
    { name: 'notes.mdown', path: '/docs/notes.mdown', type: 'file', extension: '.mdown' },
    { name: 'draft.mkd', path: '/docs/draft.mkd', type: 'file', extension: '.mkd' },
    { name: 'script.js', path: '/docs/script.js', type: 'file', extension: '.js' },
    { name: 'style.css', path: '/docs/style.css', type: 'file', extension: '.css' },
    { name: 'data.json', path: '/docs/data.json', type: 'file', extension: '.json' },
    { name: 'notes.txt', path: '/docs/notes.txt', type: 'file', extension: '.txt' },
    { name: 'image.png', path: '/docs/image.png', type: 'file', extension: '.png' },
    { name: '.hidden.md', path: '/docs/.hidden.md', type: 'file', extension: '.md' },
    { name: 'subdir', path: '/docs/subdir', type: 'directory' },
    { name: 'assets', path: '/docs/assets', type: 'directory' },
    { name: '.git', path: '/docs/.git', type: 'directory' }
  ]

  beforeEach(() => {
    browser = createBrowserStore()
    browser.setFolder('/docs', mockFiles)
  })

  // ---- 1. 扩展名支持 ----
  describe('Extension Support', () => {
    it('should support .md extension', () => {
      expect(browser.isSupportedExtension('.md')).toBe(true)
    })

    it('should support .mdx extension', () => {
      expect(browser.isSupportedExtension('.mdx')).toBe(true)
    })

    it('should support .markdown extension', () => {
      expect(browser.isSupportedExtension('.markdown')).toBe(true)
    })

    it('should support .mdown extension', () => {
      expect(browser.isSupportedExtension('.mdown')).toBe(true)
    })

    it('should support .mkd extension', () => {
      expect(browser.isSupportedExtension('.mkd')).toBe(true)
    })

    it('should reject non-markdown extensions', () => {
      expect(browser.isSupportedExtension('.js')).toBe(false)
      expect(browser.isSupportedExtension('.css')).toBe(false)
      expect(browser.isSupportedExtension('.txt')).toBe(false)
      expect(browser.isSupportedExtension('.json')).toBe(false)
      expect(browser.isSupportedExtension('.png')).toBe(false)
      expect(browser.isSupportedExtension('.pdf')).toBe(false)
    })

    it('should be case-insensitive for extensions', () => {
      expect(browser.isSupportedExtension('.MD')).toBe(true)
      expect(browser.isSupportedExtension('.Mdx')).toBe(true)
      expect(browser.isSupportedExtension('.Markdown')).toBe(true)
    })

    it('should handle extension without dot', () => {
      expect(browser.isSupportedExtension('md')).toBe(false)
    })
  })

  // ---- 2. 文件过滤 ----
  describe('File Filtering', () => {
    it('should return only markdown files from mixed list', () => {
      const mdFiles = browser.getMarkdownFiles()
      expect(mdFiles.length).toBe(5) // 5 markdown files
      mdFiles.forEach((f) => {
        expect(isSupportedFile(f.name)).toBe(true)
      })
    })

    it('should exclude .js files from markdown list', () => {
      const mdFiles = browser.getMarkdownFiles()
      expect(mdFiles.some((f) => f.name === 'script.js')).toBe(false)
    })

    it('should exclude .css files', () => {
      const mdFiles = browser.getMarkdownFiles()
      expect(mdFiles.some((f) => f.name === 'style.css')).toBe(false)
    })

    it('should exclude .txt files', () => {
      const mdFiles = browser.getMarkdownFiles()
      expect(mdFiles.some((f) => f.name === 'notes.txt')).toBe(false)
    })

    it('should exclude .json files', () => {
      const mdFiles = browser.getMarkdownFiles()
      expect(mdFiles.some((f) => f.name === 'data.json')).toBe(false)
    })

    it('should exclude image files', () => {
      const mdFiles = browser.getMarkdownFiles()
      expect(mdFiles.some((f) => f.name === 'image.png')).toBe(false)
    })

    it('should filter out hidden files with supported extension', () => {
      const displayable = browser.getDisplayableFiles()
      expect(displayable.some((f) => f.name === '.hidden.md')).toBe(false)
    })

    it('should hide .git directory', () => {
      const displayable = browser.getDisplayableFiles()
      expect(displayable.some((f) => f.name === '.git')).toBe(false)
    })

    it('should show regular directories', () => {
      const displayable = browser.getDisplayableFiles()
      const dirs = displayable.filter((f) => f.type === 'directory')
      expect(dirs.some((f) => f.name === 'subdir')).toBe(true)
      expect(dirs.some((f) => f.name === 'assets')).toBe(true)
    })
  })

  // ---- 3. 文件选择与模式切换 ----
  describe('File Selection & Mode Switching', () => {
    it('should select file for browsing (single click)', () => {
      browser.selectFile('/docs/readme.md')
      expect(browser.getState().selectedFilePath).toBe('/docs/readme.md')
      expect(browser.getState().viewMode).toBe('browser')
    })

    it('should open file for editing (double click)', () => {
      browser.openFileForEditing('/docs/readme.md')
      expect(browser.getState().selectedFilePath).toBe('/docs/readme.md')
      expect(browser.getState().viewMode).toBe('editor')
    })

    it('should update selected file path when selecting another file', () => {
      browser.selectFile('/docs/readme.md')
      browser.selectFile('/docs/guide.markdown')
      expect(browser.getState().selectedFilePath).toBe('/docs/guide.markdown')
    })
  })

  // ---- 4. 文件夹状态 ----
  describe('Folder State', () => {
    it('should start with null folder', () => {
      const emptyBrowser = createBrowserStore()
      expect(emptyBrowser.getState().currentFolder).toBeNull()
      expect(emptyBrowser.getState().files.length).toBe(0)
    })

    it('should update current folder when set', () => {
      expect(browser.getState().currentFolder).toBe('/docs')
    })

    it('should update file list when folder is set', () => {
      expect(browser.getState().files.length).toBe(mockFiles.length)
    })
  })

  // ---- 5. 展开/折叠 ----
  describe('Expand/Collapse', () => {
    it('should start with empty expanded set', () => {
      expect(browser.getState().expandedPaths.size).toBe(0)
    })

    it('should toggle directory expansion', () => {
      browser.toggleExpand('/docs/subdir')
      expect(browser.isExpanded('/docs/subdir')).toBe(true)
      browser.toggleExpand('/docs/subdir')
      expect(browser.isExpanded('/docs/subdir')).toBe(false)
    })

    it('should track multiple expanded directories', () => {
      browser.toggleExpand('/docs/subdir')
      browser.toggleExpand('/docs/assets')
      expect(browser.getState().expandedPaths.size).toBe(2)
    })
  })
})

// ============================================================
// isSupportedFile 单元测试
// ============================================================
describe('isSupportedFile Utility', () => {
  it('should return true for .md files', () => {
    expect(isSupportedFile('readme.md')).toBe(true)
  })

  it('should return true for .mdx files', () => {
    expect(isSupportedFile('component.mdx')).toBe(true)
  })

  it('should return true for .markdown files', () => {
    expect(isSupportedFile('doc.markdown')).toBe(true)
  })

  it('should return true for .mdown files', () => {
    expect(isSupportedFile('notes.mdown')).toBe(true)
  })

  it('should return true for .mkd files', () => {
    expect(isSupportedFile('draft.mkd')).toBe(true)
  })

  it('should be case-insensitive', () => {
    expect(isSupportedFile('README.MD')).toBe(true)
    expect(isSupportedFile('Doc.Markdown')).toBe(true)
    expect(isSupportedFile('File.MDX')).toBe(true)
  })

  it('should return false for non-markdown files', () => {
    expect(isSupportedFile('script.js')).toBe(false)
    expect(isSupportedFile('style.css')).toBe(false)
    expect(isSupportedFile('data.json')).toBe(false)
    expect(isSupportedFile('image.png')).toBe(false)
    expect(isSupportedFile('notes.txt')).toBe(false)
    expect(isSupportedFile('noextension')).toBe(false)
  })

  it('should return false for files with no extension', () => {
    expect(isSupportedFile('README')).toBe(false)
    expect(isSupportedFile('Makefile')).toBe(false)
  })
})