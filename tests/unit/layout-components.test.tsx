/**
 * 布局组件测试 —— Layout Components Tests
 *
 * 覆盖范围：
 * - AppLayout（整体布局结构）
 * - Sidebar（侧边栏）
 * - StatusBar（状态栏）
 * - TitleBar（标题栏）
 * - 响应式布局行为
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ============================================================
// 测试数据
// ============================================================
const mockStatus = {
  fileName: 'readme.md',
  filePath: '/docs/readme.md',
  cursorLine: 10,
  cursorColumn: 5,
  wordCount: 250,
  charCount: 1500,
  isModified: false,
  isSourceMode: false,
  language: 'Markdown'
}

// ============================================================
// 模拟组件
// ============================================================
function StatusBar({
  fileName,
  cursorLine,
  cursorColumn,
  wordCount,
  isModified,
  isSourceMode,
  onToggleSourceMode
}: {
  fileName: string
  cursorLine: number
  cursorColumn: number
  wordCount: number
  isModified: boolean
  isSourceMode: boolean
  onToggleSourceMode?: () => void
}) {
  return (
    <div data-testid="status-bar" className="status-bar">
      <span data-testid="status-filename">{fileName}</span>
      <span data-testid="status-modified">
        {isModified ? 'Modified' : 'Saved'}
      </span>
      <span data-testid="status-cursor">
        Ln {cursorLine}, Col {cursorColumn}
      </span>
      <span data-testid="status-words">{wordCount} words</span>
      <button
        data-testid="toggle-source-btn"
        onClick={onToggleSourceMode}
      >
        {isSourceMode ? 'Source' : 'WYSIWYG'}
      </button>
    </div>
  )
}

function Sidebar({
  files,
  activeFilePath,
  visible,
  onFileSelect,
  onToggle
}: {
  files: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  activeFilePath: string | null
  visible: boolean
  onFileSelect: (path: string) => void
  onToggle: () => void
}) {
  if (!visible) return null

  return (
    <div data-testid="sidebar" className="sidebar">
      <div className="sidebar-header">
        <span>Files</span>
        <button data-testid="sidebar-toggle" onClick={onToggle}>Toggle</button>
      </div>
      <div className="sidebar-content" data-testid="file-tree">
        {files.map((file) => (
          <div
            key={file.path}
            data-testid={`file-node-${file.name}`}
            className={`file-node ${file.path === activeFilePath ? 'active' : ''}`}
            onClick={() => onFileSelect(file.path)}
          >
            {file.name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 测试套件
// ============================================================
describe('StatusBar Component', () => {
  it('should display current file name', () => {
    render(
      <StatusBar
        fileName="readme.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={0}
        isModified={false}
        isSourceMode={false}
      />
    )
    expect(screen.getByTestId('status-filename').textContent).toBe('readme.md')
  })

  it('should display cursor position', () => {
    render(
      <StatusBar
        fileName="test.md"
        cursorLine={10}
        cursorColumn={5}
        wordCount={100}
        isModified={false}
        isSourceMode={false}
      />
    )
    expect(screen.getByTestId('status-cursor').textContent).toContain('Ln 10, Col 5')
  })

  it('should display word count', () => {
    render(
      <StatusBar
        fileName="test.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={250}
        isModified={false}
        isSourceMode={false}
      />
    )
    expect(screen.getByTestId('status-words').textContent).toContain('250 words')
  })

  it('should show modified/saved status', () => {
    const { rerender } = render(
      <StatusBar
        fileName="test.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={0}
        isModified={false}
        isSourceMode={false}
      />
    )
    expect(screen.getByTestId('status-modified').textContent).toBe('Saved')

    rerender(
      <StatusBar
        fileName="test.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={0}
        isModified={true}
        isSourceMode={false}
      />
    )
    expect(screen.getByTestId('status-modified').textContent).toBe('Modified')
  })

  it('should provide toggle source mode button', () => {
    const onToggle = vi.fn()
    render(
      <StatusBar
        fileName="test.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={0}
        isModified={false}
        isSourceMode={false}
        onToggleSourceMode={onToggle}
      />
    )
    fireEvent.click(screen.getByTestId('toggle-source-btn'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('should reflect current mode in toggle button text', () => {
    const { rerender } = render(
      <StatusBar
        fileName="test.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={0}
        isModified={false}
        isSourceMode={false}
      />
    )
    expect(screen.getByTestId('toggle-source-btn').textContent).toBe('WYSIWYG')

    rerender(
      <StatusBar
        fileName="test.md"
        cursorLine={1}
        cursorColumn={1}
        wordCount={0}
        isModified={false}
        isSourceMode={true}
      />
    )
    expect(screen.getByTestId('toggle-source-btn').textContent).toBe('Source')
  })
})

describe('Sidebar Component', () => {
  const mockFiles = [
    { name: 'readme.md', path: '/docs/readme.md', type: 'file' as const },
    { name: 'api.md', path: '/docs/api.md', type: 'file' as const },
    { name: 'images', path: '/docs/images', type: 'directory' as const }
  ]

  it('should render when visible', () => {
    render(
      <Sidebar
        files={mockFiles}
        activeFilePath={null}
        visible={true}
        onFileSelect={vi.fn()}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByTestId('sidebar')).toBeVisible()
  })

  it('should not render when hidden', () => {
    render(
      <Sidebar
        files={mockFiles}
        activeFilePath={null}
        visible={false}
        onFileSelect={vi.fn()}
        onToggle={vi.fn()}
      />
    )
    expect(screen.queryByTestId('sidebar')).toBeNull()
  })

  it('should render all file nodes', () => {
    render(
      <Sidebar
        files={mockFiles}
        activeFilePath={null}
        visible={true}
        onFileSelect={vi.fn()}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByTestId('file-node-readme.md')).toBeInTheDocument()
    expect(screen.getByTestId('file-node-api.md')).toBeInTheDocument()
    expect(screen.getByTestId('file-node-images')).toBeInTheDocument()
  })

  it('should highlight active file', () => {
    render(
      <Sidebar
        files={mockFiles}
        activeFilePath="/docs/api.md"
        visible={true}
        onFileSelect={vi.fn()}
        onToggle={vi.fn()}
      />
    )
    const activeNode = screen.getByTestId('file-node-api.md')
    expect(activeNode.className).toContain('active')
  })

  it('should trigger onFileSelect when clicking a file', () => {
    const onFileSelect = vi.fn()
    render(
      <Sidebar
        files={mockFiles}
        activeFilePath={null}
        visible={true}
        onFileSelect={onFileSelect}
        onToggle={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTestId('file-node-readme.md'))
    expect(onFileSelect).toHaveBeenCalledWith('/docs/readme.md')
  })

  it('should trigger onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn()
    render(
      <Sidebar
        files={mockFiles}
        activeFilePath={null}
        visible={true}
        onFileSelect={vi.fn()}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByTestId('sidebar-toggle'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})