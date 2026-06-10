import React, { useEffect, useState } from 'react'

interface TitleBarProps {
  fileName?: string
  isModified?: boolean
  appName?: string
}

export function TitleBar({ fileName, isModified = false, appName = 'Peter Markdown' }: TitleBarProps) {
  const [platform, setPlatform] = useState<string | null>(null)

  useEffect(() => {
    if (window.electronAPI?.getPlatform) {
      setPlatform(window.electronAPI.getPlatform())
    }
  }, [])

  const title = fileName
    ? `${isModified ? '● ' : ''}${fileName} — ${appName}`
    : appName

  return (
    <div className="titlebar">
      <div className="titlebar-spacer">
        {platform && platform !== 'darwin' && (
          <div className="titlebar-controls">
            <button className="titlebar-btn close" aria-label="Close" />
            <button className="titlebar-btn minimize" aria-label="Minimize" />
            <button className="titlebar-btn maximize" aria-label="Maximize" />
          </div>
        )}
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
