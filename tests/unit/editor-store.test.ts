/**
 * 编辑器状态管理测试 —— Editor Store Tests
 *
 * 覆盖范围：
 * - 打开/关闭标签页
 * - 当前激活文件管理
 * - 文件内容变更跟踪（是否已修改）
 * - 多标签页切换
 * - 状态持久化
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ============================================================
// 类型定义
// ============================================================
interface Tab {
  id: string
  filePath: string
  fileName: string
  content: string
  savedContent: string
  isModified: boolean
  cursorPosition?: { line: number; column: number }
}

interface EditorStore {
  tabs: Tab[]
  activeTabId: string | null
  sidebarVisible: boolean
  sourceMode: boolean

  // Actions
  openFile: (filePath: string, content: string) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateContent: (tabId: string, content: string) => void
  markSaved: (tabId: string) => void
  saveCurrentFile: () => void
  toggleSidebar: () => void
  toggleSourceMode: () => void
  getActiveTab: () => Tab | null
  getModifiedTabs: () => Tab[]
  hasUnsavedChanges: () => boolean
  closeAllTabs: () => void
  setCursorPosition: (tabId: string, line: number, column: number) => void
}

// ============================================================
// 模拟实现（TODO：替换为真实 Zustand store）
// ============================================================
function createEditorStore(): EditorStore {
  let tabs: Tab[] = []
  let activeTabId: string | null = null
  let sidebarVisible = true
  let sourceMode = false
  let tabIdCounter = 0

  function generateTabId(): string {
    tabIdCounter++
    return `tab_${tabIdCounter}_${Date.now()}`
  }

  return {
    get tabs() { return tabs },
    get activeTabId() { return activeTabId },
    get sidebarVisible() { return sidebarVisible },
    get sourceMode() { return sourceMode },

    openFile(filePath: string, content: string) {
      // 检查是否已打开
      const existing = tabs.find((t) => t.filePath === filePath)
      if (existing) {
        activeTabId = existing.id
        return
      }

      const newTab: Tab = {
        id: generateTabId(),
        filePath,
        fileName: filePath.split('/').pop() || filePath,
        content,
        savedContent: content,
        isModified: false
      }
      tabs = [...tabs, newTab]
      activeTabId = newTab.id
    },

    closeTab(tabId: string) {
      tabs = tabs.filter((t) => t.id !== tabId)
      if (activeTabId === tabId) {
        activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null
      }
    },

    setActiveTab(tabId: string) {
      if (tabs.find((t) => t.id === tabId)) {
        activeTabId = tabId
      }
    },

    updateContent(tabId: string, content: string) {
      tabs = tabs.map((t) => {
        if (t.id !== tabId) return t
        return {
          ...t,
          content,
          isModified: content !== t.savedContent
        }
      })
    },

    markSaved(tabId: string) {
      tabs = tabs.map((t) => {
        if (t.id !== tabId) return t
        return {
          ...t,
          savedContent: t.content,
          isModified: false
        }
      })
    },

    saveCurrentFile() {
      if (activeTabId) {
        this.markSaved(activeTabId)
      }
    },

    toggleSidebar() {
      sidebarVisible = !sidebarVisible
    },

    toggleSourceMode() {
      sourceMode = !sourceMode
    },

    getActiveTab(): Tab | null {
      return tabs.find((t) => t.id === activeTabId) ?? null
    },

    getModifiedTabs(): Tab[] {
      return tabs.filter((t) => t.isModified)
    },

    hasUnsavedChanges(): boolean {
      return tabs.some((t) => t.isModified)
    },

    closeAllTabs() {
      tabs = []
      activeTabId = null
    },

    setCursorPosition(tabId: string, line: number, column: number) {
      tabs = tabs.map((t) => {
        if (t.id !== tabId) return t
        return { ...t, cursorPosition: { line, column } }
      })
    }
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('EditorStore — Tab & File State Management', () => {
  let store: EditorStore

  beforeEach(() => {
    store = createEditorStore()
  })

  // ---- 1. 打开文件 ----
  describe('Opening Files', () => {
    it('should create a new tab when opening a file', () => {
      store.openFile('/test/doc.md', '# Hello')
      expect(store.tabs.length).toBe(1)
      expect(store.tabs[0].fileName).toBe('doc.md')
      expect(store.tabs[0].filePath).toBe('/test/doc.md')
    })

    it('should set opened file as active tab', () => {
      store.openFile('/test/a.md', 'A')
      store.openFile('/test/b.md', 'B')
      expect(store.activeTabId).toBe(store.tabs[1].id)
    })

    it('should reuse existing tab if file already open', () => {
      store.openFile('/test/doc.md', '# Hello')
      const firstTabId = store.activeTabId
      store.openFile('/test/doc.md', '# Hello')
      expect(store.tabs.length).toBe(1)
      expect(store.activeTabId).toBe(firstTabId)
    })

    it('should correctly extract filename from path', () => {
      store.openFile('/a/b/c/deep-file.md', 'content')
      expect(store.tabs[0].fileName).toBe('deep-file.md')
    })

    it('should mark new file as not modified', () => {
      store.openFile('/test/new.md', 'content')
      expect(store.tabs[0].isModified).toBe(false)
    })
  })

  // ---- 2. 关闭标签页 ----
  describe('Closing Tabs', () => {
    beforeEach(() => {
      store.openFile('/test/a.md', 'A')
      store.openFile('/test/b.md', 'B')
      store.openFile('/test/c.md', 'C')
    })

    it('should remove tab from list', () => {
      const tabToClose = store.tabs[0].id
      store.closeTab(tabToClose)
      expect(store.tabs.length).toBe(2)
      expect(store.tabs.some((t) => t.id === tabToClose)).toBe(false)
    })

    it('should switch to another tab if closing active tab', () => {
      const activeId = store.activeTabId!
      store.closeTab(activeId)
      expect(store.activeTabId).not.toBe(activeId)
      expect(store.activeTabId).toBeTruthy()
    })

    it('should set activeTab to null when closing last tab', () => {
      store.closeTab(store.tabs[0].id)
      store.closeTab(store.tabs[0].id)
      store.closeTab(store.tabs[0].id)
      expect(store.tabs.length).toBe(0)
      expect(store.activeTabId).toBeNull()
    })

    it('should close all tabs at once', () => {
      store.closeAllTabs()
      expect(store.tabs.length).toBe(0)
      expect(store.activeTabId).toBeNull()
    })
  })

  // ---- 3. 切换标签页 ----
  describe('Tab Switching', () => {
    beforeEach(() => {
      store.openFile('/test/a.md', 'A')
      store.openFile('/test/b.md', 'B')
      store.openFile('/test/c.md', 'C')
    })

    it('should switch active tab', () => {
      const firstTabId = store.tabs[0].id
      store.setActiveTab(firstTabId)
      expect(store.activeTabId).toBe(firstTabId)
    })

    it('should not switch to non-existent tab', () => {
      const currentId = store.activeTabId
      store.setActiveTab('non-existent')
      expect(store.activeTabId).toBe(currentId)
    })

    it('should get the active tab correctly', () => {
      const activeTab = store.getActiveTab()
      expect(activeTab).not.toBeNull()
      expect(activeTab!.id).toBe(store.activeTabId)
    })

    it('should return null for getActiveTab when no tabs open', () => {
      store.closeAllTabs()
      expect(store.getActiveTab()).toBeNull()
    })
  })

  // ---- 4. 内容修改跟踪 ----
  describe('Content Modification Tracking', () => {
    beforeEach(() => {
      store.openFile('/test/doc.md', 'Original content')
    })

    it('should track content changes via isModified flag', () => {
      store.updateContent(store.tabs[0].id, 'Modified content')
      expect(store.tabs[0].isModified).toBe(true)
    })

    it('should mark as unmodified after save', () => {
      store.updateContent(store.tabs[0].id, 'Modified')
      store.markSaved(store.tabs[0].id)
      expect(store.tabs[0].isModified).toBe(false)
    })

    it('should compare content with savedContent', () => {
      // 修改回原始内容应重置 isModified
      store.updateContent(store.tabs[0].id, 'Different content')
      expect(store.tabs[0].isModified).toBe(true)

      store.updateContent(store.tabs[0].id, 'Original content')
      expect(store.tabs[0].isModified).toBe(false)
    })

    it('should detect unsaved changes globally', () => {
      expect(store.hasUnsavedChanges()).toBe(false)
      store.updateContent(store.tabs[0].id, 'Changed')
      expect(store.hasUnsavedChanges()).toBe(true)
    })

    it('should return only modified tabs', () => {
      store.openFile('/test/other.md', 'Other')
      store.updateContent(store.tabs[0].id, 'Changed')
      const modified = store.getModifiedTabs()
      expect(modified.length).toBe(1)
      expect(modified[0].filePath).toBe('/test/doc.md')
    })

    it('should apply save to current file', () => {
      store.openFile('/test/other.md', 'Other')
      store.updateContent(store.activeTabId!, 'Changed')
      store.saveCurrentFile()
      expect(store.getActiveTab()!.isModified).toBe(false)
    })
  })

  // ---- 5. UI 状态 ----
  describe('UI State Toggles', () => {
    it('should start with sidebar visible', () => {
      expect(store.sidebarVisible).toBe(true)
    })

    it('should toggle sidebar visibility', () => {
      store.toggleSidebar()
      expect(store.sidebarVisible).toBe(false)
      store.toggleSidebar()
      expect(store.sidebarVisible).toBe(true)
    })

    it('should start in WYSIWYG mode (not source mode)', () => {
      expect(store.sourceMode).toBe(false)
    })

    it('should toggle source mode', () => {
      store.toggleSourceMode()
      expect(store.sourceMode).toBe(true)
      store.toggleSourceMode()
      expect(store.sourceMode).toBe(false)
    })
  })

  // ---- 6. 光标位置 ----
  describe('Cursor Position', () => {
    beforeEach(() => {
      store.openFile('/test/doc.md', 'Line 1\nLine 2\nLine 3')
    })

    it('should store cursor position', () => {
      store.setCursorPosition(store.tabs[0].id, 2, 5)
      expect(store.tabs[0].cursorPosition).toEqual({ line: 2, column: 5 })
    })

    it('should update cursor position', () => {
      store.setCursorPosition(store.tabs[0].id, 1, 1)
      store.setCursorPosition(store.tabs[0].id, 3, 10)
      expect(store.tabs[0].cursorPosition).toEqual({ line: 3, column: 10 })
    })
  })

  // ---- 7. 边界情况 ----
  describe('Edge Cases', () => {
    it('should handle opening same file from different paths (normalized)', () => {
      store.openFile('/test/doc.md', 'Content')
      store.openFile('/test/./doc.md', 'Content')
      // 注：实际实现中应做路径标准化
    })

    it('should handle empty file content', () => {
      store.openFile('/test/empty.md', '')
      expect(store.tabs[0].content).toBe('')
      expect(store.tabs[0].isModified).toBe(false)
    })

    it('should handle very long file names', () => {
      const longName = 'a'.repeat(200) + '.md'
      store.openFile('/test/' + longName, 'content')
      expect(store.tabs[0].fileName.length).toBe(204)
    })
  })
})