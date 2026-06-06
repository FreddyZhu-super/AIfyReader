import React from 'react'

interface EditorToolbarProps {
  tocVisible: boolean
  isSourceMode: boolean
  onToggleToc: () => void
  onToggleSourceMode: () => void
}

export function EditorToolbar({
  tocVisible,
  isSourceMode,
  onToggleToc,
  onToggleSourceMode
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-left">
        <button
          className={`toolbar-btn ${tocVisible ? 'active' : ''}`}
          onClick={onToggleToc}
          title="Toggle outline (Ctrl+Shift+O)"
        >
          📖
          <span className="tooltip">Outline</span>
        </button>
      </div>

      <div className="editor-toolbar-right">
        <button
          className={`toolbar-btn ${isSourceMode ? 'active' : ''}`}
          onClick={onToggleSourceMode}
          title="Toggle source mode (Ctrl+/)"
        >
          {'</>'}
          <span className="tooltip">{isSourceMode ? 'WYSIWYG' : 'Source'}</span>
        </button>
      </div>
    </div>
  )
}
