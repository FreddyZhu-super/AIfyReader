import React, { useMemo } from 'react'
import { createMarkdownParser, type TocEntry } from '../parser/markdownParser'

interface MarkdownRendererProps {
  content: string
  className?: string
  onTocReady?: (toc: TocEntry[]) => void
  onError?: (error: Error) => void
}

export function MarkdownRenderer({
  content,
  className = '',
  onTocReady,
  onError
}: MarkdownRendererProps) {
  const rendered = useMemo(() => {
    if (!content || !content.trim()) {
      return { html: '', toc: [] }
    }

    try {
      const parser = createMarkdownParser()
      const result = parser.parse(content)

      if (onTocReady && result.toc.length > 0) {
        // Use setTimeout to avoid setState during render
        setTimeout(() => onTocReady(result.toc), 0)
      }

      return result
    } catch (e) {
      if (onError) {
        setTimeout(() => onError(e as Error), 0)
      }
      return { html: `<p>Error rendering markdown: ${(e as Error).message}</p>`, toc: [] }
    }
  }, [content, onTocReady, onError])

  if (!rendered.html) {
    return (
      <div className={`markdown-body markdown-empty ${className}`}>
        <div className="empty-state">No content to display</div>
      </div>
    )
  }

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  )
}
