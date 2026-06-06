import React from 'react'

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
}

interface SidebarProps {
  folderName?: string
  files: FileEntry[]
  activeFilePath: string | null
  visible: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onFileClick: (path: string) => void
  onFileDoubleClick: (path: string) => void
  onToggle: () => void
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
}

export function Sidebar({
  folderName,
  files,
  activeFilePath,
  visible,
  searchQuery,
  onSearchChange,
  onFileClick,
  onFileDoubleClick,
  onToggle,
  expandedPaths,
  onToggleExpand
}: SidebarProps) {
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`sidebar ${visible ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-title">
          <span>📂</span>
          <span>{folderName || 'No folder open'}</span>
        </div>
        <div className="sidebar-header-actions">
          <button className="sidebar-header-btn" onClick={onToggle} title="Close sidebar">
            ◀
          </button>
        </div>
      </div>

      <div className="file-search">
        <input
          className="file-search-input"
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="file-tree">
        {filteredFiles.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {searchQuery ? 'No matching files' : 'No files found'}
          </div>
        ) : (
          filteredFiles.map((file) => (
            <FileTreeNode
              key={file.path}
              node={file}
              depth={0}
              isActive={file.path === activeFilePath}
              isExpanded={expandedPaths.has(file.path)}
              onClick={() => onFileClick(file.path)}
              onDoubleClick={() => onFileDoubleClick(file.path)}
              onToggleExpand={() => onToggleExpand(file.path)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileEntry
  depth: number
  isActive: boolean
  isExpanded: boolean
  onClick: () => void
  onDoubleClick: () => void
  onToggleExpand: () => void
}

function FileTreeNode({
  node,
  depth,
  isActive,
  isExpanded,
  onClick,
  onDoubleClick,
  onToggleExpand
}: FileTreeNodeProps) {
  const isDir = node.type === 'directory'
  const icon = isDir
    ? isExpanded ? '📂' : '📁'
    : '📄'

  return (
    <div
      className={`file-tree-node ${isActive ? 'active' : ''}`}
      data-depth={depth}
      onClick={(e) => {
        if (isDir) {
          onToggleExpand()
        } else {
          onClick()
        }
      }}
      onDoubleClick={() => {
        if (!isDir) onDoubleClick()
      }}
    >
      {isDir && (
        <span className={`file-tree-node-arrow ${isExpanded ? 'expanded' : ''}`}>
          ▶
        </span>
      )}
      <span className="file-tree-node-icon">{icon}</span>
      <span className="file-tree-node-name">{node.name}</span>
    </div>
  )
}
