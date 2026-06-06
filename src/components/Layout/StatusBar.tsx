import React from 'react'

interface StatusBarProps {
  fileName?: string
  isModified?: boolean
  wordCount?: number
  charCount?: number
  cursorLine?: number
  cursorColumn?: number
  isSourceMode?: boolean
  onToggleSourceMode?: () => void
  totalFiles?: number
}

export function StatusBar({
  fileName,
  isModified = false,
  wordCount = 0,
  charCount = 0,
  cursorLine = 1,
  cursorColumn = 1,
  isSourceMode = false,
  onToggleSourceMode,
  totalFiles
}: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        {fileName ? (
          <>
            <span className="statusbar-item">{fileName}</span>
            <span className={`statusbar-item ${isModified ? 'statusbar-modified' : ''}`}>
              {isModified ? '● Modified' : 'Saved'}
            </span>
          </>
        ) : (
          <span className="statusbar-item">
            {totalFiles !== undefined
              ? `${totalFiles} files in folder`
              : 'No file open'}
          </span>
        )}
      </div>

      <div className="statusbar-right">
        {fileName && (
          <>
            <span className="statusbar-item">
              {wordCount} words
            </span>
            <span className="statusbar-item">
              Ln {cursorLine}, Col {cursorColumn}
            </span>
            {onToggleSourceMode && (
              <span
                className="statusbar-item clickable statusbar-mode"
                onClick={onToggleSourceMode}
              >
                {isSourceMode ? 'Source' : 'WYSIWYG'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
