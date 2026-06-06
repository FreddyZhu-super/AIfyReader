import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { TitleBar } from './components/Layout/TitleBar'
import { Sidebar } from './components/Layout/Sidebar'
import { StatusBar } from './components/Layout/StatusBar'
import { TocPanel } from './components/Layout/TocPanel'
import { WelcomePage } from './components/Layout/WelcomePage'
import { EditorToolbar } from './components/Editor/EditorToolbar'
import { MarkdownRenderer } from './renderer/MarkdownRenderer'
import { useUIStore, type TocItem } from './store/uiStore'
import { createMarkdownParser, type TocEntry } from './parser/markdownParser'

function App() {
  const {
    sidebarVisible,
    toggleSidebar,
    currentFolder,
    files,
    activeFilePath,
    expandedPaths,
    searchQuery,
    setActiveFile,
    toggleExpand,
    setSearchQuery,
    isSourceMode,
    viewMode,
    toggleSourceMode,
    setViewMode,
    tocVisible,
    tocItems,
    activeAnchor,
    toggleToc,
    setTocVisible,
    setTocItems,
    setActiveAnchor,
    cursorLine,
    cursorColumn,
    wordCount,
    charCount,
    setWordCount
  } = useUIStore()

  const [fileContent, setFileContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [isModified, setIsModified] = useState(false)
  const [parserError, setParserError] = useState<string | null>(null)
  const parserRef = useRef(createMarkdownParser())

  // When active file changes, try to read it
  useEffect(() => {
    if (!activeFilePath) {
      setFileContent('')
      setFileName('')
      setIsModified(false)
      setParserError(null)
      return
    }

    const name = activeFilePath.split('/').pop() || activeFilePath.split('\\').pop() || ''
    setFileName(name)

    // Try to read the file via Electron IPC
    async function loadFile() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.readFile(activeFilePath)
          setFileContent(result.content)
          setIsModified(false)
          setParserError(null)

          // Count words
          const words = result.content.split(/\s+/).filter(Boolean).length
          const chars = result.content.length
          setWordCount(words, chars)
        }
      } catch (err) {
        console.error('Failed to read file:', err)
        setParserError('Failed to read file: ' + (err as Error).message)
      }
    }

    loadFile()
  }, [activeFilePath, setWordCount])

  // Handle file click: browse mode (single click)
  const handleFileClick = useCallback((path: string) => {
    setActiveFile(path)
    setViewMode('browser')
  }, [setActiveFile, setViewMode])

  // Handle file double-click: edit mode
  const handleFileDoubleClick = useCallback((path: string) => {
    setActiveFile(path)
    setViewMode('editor')
  }, [setActiveFile, setViewMode])

  // Handle TOC ready from renderer
  const handleTocReady = useCallback((toc: TocEntry[]) => {
    setTocItems(toc as unknown as TocItem[])
  }, [setTocItems])

  // Handle render error
  const handleRenderError = useCallback((error: Error) => {
    setParserError(error.message)
  }, [])

  // TOC click handler
  const handleTocItemClick = useCallback((anchor: string, position: number) => {
    setActiveAnchor(anchor)

    // Scroll to the heading element
    const el = document.getElementById(anchor)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('heading-highlight')
      setTimeout(() => el.classList.remove('heading-highlight'), 1500)
    }

    setTocVisible(false)
  }, [setActiveAnchor, setTocVisible])

  // Open folder via IPC
  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.openFolderDialog()
      if (!result.canceled && result.filePaths.length > 0) {
        // In real app, we'd load the file tree via IPC
        console.log('Folder opened:', result.filePaths[0])
      }
    } catch (err) {
      console.error('Failed to open folder:', err)
    }
  }, [])

  // Open file via IPC
  const handleOpenFile = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.openFileDialog()
      if (!result.canceled && result.filePaths.length > 0) {
        setActiveFile(result.filePaths[0])
        setViewMode('editor')
      }
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [setActiveFile, setViewMode])

  // Listen for menu actions from Electron
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'toggle-sidebar':
            toggleSidebar()
            break
          case 'toggle-source':
            toggleSourceMode()
            break
          case 'toggle-toc':
            toggleToc()
            break
        }
      })
    }
  }, [toggleSidebar, toggleSourceMode, toggleToc])

  // Listen for files/folders opened from menu
  useEffect(() => {
    if (window.electronAPI?.onFilesOpened) {
      window.electronAPI.onFilesOpened((paths: string[]) => {
        if (paths.length > 0) {
          setActiveFile(paths[0])
          setViewMode('editor')
        }
      })
    }
    if (window.electronAPI?.onFolderOpened) {
      window.electronAPI.onFolderOpened((_path: string) => {
        // TODO: load file tree
      })
    }
  }, [setActiveFile, setViewMode])

  // Render the editor content area
  const renderEditorContent = () => {
    if (!activeFilePath) {
      return <WelcomePage onOpenFolder={handleOpenFolder} onOpenFile={handleOpenFile} />
    }

    if (parserError) {
      return (
        <div className="editor-content">
          <div style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>⚠️</div>
            <div>{parserError}</div>
          </div>
        </div>
      )
    }

    if (isSourceMode) {
      return (
        <div
          className="editor-content"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            padding: '16px 24px',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            color: 'var(--text-primary)'
          }}
        >
          {fileContent}
        </div>
      )
    }

    return (
      <div className="editor-content">
        {viewMode === 'browser' ? (
          <MarkdownRenderer
            content={fileContent}
            onTocReady={handleTocReady}
            onError={handleRenderError}
          />
        ) : (
          <MarkdownRenderer
            content={fileContent}
            onTocReady={handleTocReady}
            onError={handleRenderError}
          />
        )}
      </div>
    )
  }

  return (
    <AppLayout
      titleBar={
        <TitleBar
          fileName={fileName}
          isModified={isModified}
        />
      }
      sidebar={
        <Sidebar
          folderName={currentFolder || undefined}
          files={files}
          activeFilePath={activeFilePath}
          visible={sidebarVisible}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFileClick={handleFileClick}
          onFileDoubleClick={handleFileDoubleClick}
          onToggle={toggleSidebar}
          expandedPaths={expandedPaths}
          onToggleExpand={toggleExpand}
        />
      }
      editor={
        <>
          {activeFilePath && (
            <EditorToolbar
              tocVisible={tocVisible}
              isSourceMode={isSourceMode}
              onToggleToc={toggleToc}
              onToggleSourceMode={toggleSourceMode}
            />
          )}
          {renderEditorContent()}
        </>
      }
      tocPanel={
        <TocPanel
          visible={tocVisible}
          items={tocItems}
          activeAnchor={activeAnchor}
          onClose={() => setTocVisible(false)}
          onItemClick={handleTocItemClick}
        />
      }
      statusBar={
        <StatusBar
          fileName={fileName}
          isModified={isModified}
          wordCount={wordCount}
          charCount={charCount}
          cursorLine={cursorLine}
          cursorColumn={cursorColumn}
          isSourceMode={isSourceMode}
          onToggleSourceMode={toggleSourceMode}
        />
      }
    />
  )
}

export default App
