import React from 'react'

export interface TocItem {
  level: number
  text: string
  anchor: string
  position: number
  children: TocItem[]
}

interface TocPanelProps {
  visible: boolean
  items: TocItem[]
  activeAnchor: string | null
  onClose: () => void
  onItemClick: (anchor: string, position: number) => void
}

export function TocPanel({
  visible,
  items,
  activeAnchor,
  onClose,
  onItemClick
}: TocPanelProps) {
  if (!visible && items.length === 0) return null

  const flatten = (tocItems: TocItem[]): Array<{ level: number; text: string; anchor: string; position: number }> => {
    const result: Array<{ level: number; text: string; anchor: string; position: number }> = []
    const walk = (list: TocItem[]) => {
      for (const item of list) {
        result.push({ level: item.level, text: item.text, anchor: item.anchor, position: item.position })
        walk(item.children)
      }
    }
    walk(tocItems)
    return result
  }

  const flatItems = flatten(items)

  return (
    <>
      <div
        className={`toc-mask ${visible ? 'visible' : ''}`}
        onClick={onClose}
      />

      <div className={`toc-panel ${visible ? 'visible' : ''}`}>
        <div className="toc-header">
          <span className="toc-header-title">📖 Outline</span>
          <button className="toc-close-btn" onClick={onClose} aria-label="Close outline">
            ✕
          </button>
        </div>

        <div className="toc-body">
          {flatItems.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No headings found
            </div>
          ) : (
            flatItems.map((item) => (
              <button
                key={item.anchor}
                className={`toc-item ${item.anchor === activeAnchor ? 'active' : ''}`}
                data-level={item.level}
                onClick={() => onItemClick(item.anchor, item.position)}
              >
                {item.text}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
