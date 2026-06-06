import React from 'react'

interface TitleBarProps {
  fileName?: string
  isModified?: boolean
  appName?: string
}

export function TitleBar({ fileName, isModified = false, appName = 'Peter Markdown' }: TitleBarProps) {
  const title = fileName
    ? `${isModified ? '● ' : ''}${fileName} — ${appName}`
    : appName

  return (
    <div className="titlebar">
      <div className="titlebar-spacer">
        <div className="titlebar-controls">
          <button className="titlebar-btn close" aria-label="Close" />
          <button className="titlebar-btn minimize" aria-label="Minimize" />
          <button className="titlebar-btn maximize" aria-label="Maximize" />
        </div>
      </div>

      <div className="titlebar-drag">
        <div className="titlebar-title">
          {isModified && <span className="unsaved-dot" />}
          {title}
        </div>
      </div>

      <div className="titlebar-spacer" />
    </div>
  )
}
