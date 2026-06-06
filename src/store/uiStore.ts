import { create } from 'zustand'

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
}

export interface TocItem {
  level: number
  text: string
  anchor: string
  position: number
  children: TocItem[]
}

export interface Tab {
  id: string
  filePath: string
  fileName: string
  content: string
  savedContent: string
  isModified: boolean
}

interface UIState {
  // Sidebar
  sidebarVisible: boolean
  toggleSidebar: () => void

  // File tree
  currentFolder: string | null
  files: FileEntry[]
  activeFilePath: string | null
  expandedPaths: Set<string>
  searchQuery: string

  setFolder: (folder: string, files: FileEntry[]) => void
  setActiveFile: (path: string | null) => void
  toggleExpand: (path: string) => void
  setSearchQuery: (query: string) => void

  // Editor mode
  isSourceMode: boolean
  viewMode: 'browser' | 'editor'
  toggleSourceMode: () => void
  setViewMode: (mode: 'browser' | 'editor') => void

  // TOC
  tocVisible: boolean
  tocItems: TocItem[]
  activeAnchor: string | null
  toggleToc: () => void
  setTocVisible: (visible: boolean) => void
  setTocItems: (items: TocItem[]) => void
  setActiveAnchor: (anchor: string | null) => void

  // Status bar
  cursorLine: number
  cursorColumn: number
  wordCount: number
  charCount: number
  setCursorPosition: (line: number, col: number) => void
  setWordCount: (words: number, chars: number) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Sidebar
  sidebarVisible: true,
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),

  // File tree
  currentFolder: null,
  files: [],
  activeFilePath: null,
  expandedPaths: new Set<string>(),
  searchQuery: '',

  setFolder: (folder, files) =>
    set({ currentFolder: folder, files, activeFilePath: null }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  toggleExpand: (path) => {
    const expanded = new Set(get().expandedPaths)
    if (expanded.has(path)) {
      expanded.delete(path)
    } else {
      expanded.add(path)
    }
    set({ expandedPaths: expanded })
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Editor mode
  isSourceMode: false,
  viewMode: 'browser',
  toggleSourceMode: () => set((s) => ({ isSourceMode: !s.isSourceMode })),
  setViewMode: (mode) => set({ viewMode: mode }),

  // TOC
  tocVisible: false,
  tocItems: [],
  activeAnchor: null,
  toggleToc: () => set((s) => ({ tocVisible: !s.tocVisible })),
  setTocVisible: (visible) => set({ tocVisible: visible }),
  setTocItems: (items) => set({ tocItems: items }),
  setActiveAnchor: (anchor) => set({ activeAnchor: anchor }),

  // Status bar
  cursorLine: 1,
  cursorColumn: 1,
  wordCount: 0,
  charCount: 0,
  setCursorPosition: (line, col) => set({ cursorLine: line, cursorColumn: col }),
  setWordCount: (words, chars) => set({ wordCount: words, charCount: chars })
}))
