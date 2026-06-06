import React from 'react'
import '@/styles/global.css'
import '@/styles/layout.css'
import '@/styles/markdown.css'

interface AppLayoutProps {
  sidebar: React.ReactNode
  editor: React.ReactNode
  statusBar: React.ReactNode
  tocPanel: React.ReactNode
  titleBar: React.ReactNode
}

export function AppLayout({ sidebar, editor, statusBar, tocPanel, titleBar }: AppLayoutProps) {
  return (
    <div className="app-container">
      {titleBar}
      <div className="main-layout">
        {sidebar}
        <div className="editor-area">
          {editor}
        </div>
        {tocPanel}
      </div>
      {statusBar}
    </div>
  )
}
