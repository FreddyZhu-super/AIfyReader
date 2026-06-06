import React from 'react'

interface WelcomePageProps {
  onOpenFolder?: () => void
  onOpenFile?: () => void
}

export function WelcomePage({ onOpenFolder, onOpenFile }: WelcomePageProps) {
  return (
    <div className="editor-welcome">
      <div className="editor-welcome-icon">✏️</div>
      <div className="editor-welcome-title">Peter Markdown</div>
      <div className="editor-welcome-hint">Open a folder to browse and edit Markdown files</div>

      <div className="editor-welcome-shortcuts">
        {onOpenFolder && (
          <div className="editor-welcome-shortcut">
            <kbd>Ctrl+Shift+O</kbd>
            <span>Open folder</span>
          </div>
        )}
        {onOpenFile && (
          <div className="editor-welcome-shortcut">
            <kbd>Ctrl+O</kbd>
            <span>Open file</span>
          </div>
        )}
        <div className="editor-welcome-shortcut">
          <kbd>Ctrl+N</kbd>
          <span>New file</span>
        </div>
        <div className="editor-welcome-shortcut">
          <kbd>Ctrl+S</kbd>
          <span>Save file</span>
        </div>
        <div className="editor-welcome-shortcut">
          <kbd>Ctrl+Shift+O</kbd>
          <span>Toggle outline</span>
        </div>
        <div className="editor-welcome-shortcut">
          <kbd>Ctrl+/</kbd>
          <span>Toggle source mode</span>
        </div>
      </div>
    </div>
  )
}
