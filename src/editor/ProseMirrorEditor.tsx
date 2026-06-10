import React, { useRef, useEffect } from 'react'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema } from './schema'
import { buildKeymap } from './plugins/keymap'
import { buildInputRules } from './plugins/inputRules'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { defaultMarkdownParser, MarkdownParser } from 'prosemirror-markdown'
import { serializeToMarkdown } from './markdownSerializer'

export interface TocEntry {
  level: number
  text: string
  anchor: string
  position: number
}

interface ProseMirrorEditorProps {
  content: string
  editable?: boolean
  onMarkdownChange?: (markdown: string) => void
  onSelectionChange?: (line: number, col: number) => void
  onSave?: () => void
  onTocChange?: (toc: TocEntry[]) => void
}

export function ProseMirrorEditor({
  content,
  editable = true,
  onMarkdownChange,
  onSelectionChange,
  onSave,
  onTocChange
}: ProseMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isInternalChangeRef = useRef(false)
  const onMarkdownChangeRef = useRef(onMarkdownChange)
  const onSaveRef = useRef(onSave)
  const onTocChangeRef = useRef(onTocChange)

  useEffect(() => {
    onMarkdownChangeRef.current = onMarkdownChange
  }, [onMarkdownChange])

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    onTocChangeRef.current = onTocChange
  }, [onTocChange])

  // Create editor on mount
  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      schema,
      plugins: [
        history(),
        buildKeymap(schema),
        keymap(baseKeymap),
        buildInputRules(schema),
        keymap({
          'Mod-s': () => {
            onSaveRef.current?.()
            return true
          },
          'Mod-z': undo,
          'Shift-Mod-z': redo
        })
      ]
    })

    const view = new EditorView(editorRef.current, {
      state,
      editable: () => editable,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr)
        view.updateState(newState)

        if (tr.docChanged && !isInternalChangeRef.current) {
          if (onMarkdownChangeRef.current) {
            const md = serializeToMarkdown(newState.doc)
            onMarkdownChangeRef.current(md)
          }
          if (onTocChangeRef.current) {
            const toc = extractToc(newState.doc)
            onTocChangeRef.current(toc)
          }
        }

        if (onSelectionChange && tr.selectionSet) {
          const { from } = newState.selection
          const $from = newState.doc.resolve(from)
          onSelectionChange($from.parentOffset + 1, from - $from.start() + 1)
        }
      }
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Update editable state
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.setProps({ editable: () => editable })
    }
  }, [editable])

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current) return
    if (isInternalChangeRef.current) return

    const view = viewRef.current
    const currentMd = serializeToMarkdown(view.state.doc)

    if (content === currentMd) return

    try {
      const mdParser = new MarkdownParser(
        schema,
        defaultMarkdownParser.tokenizer,
        defaultMarkdownParser.tokens
      )
      const doc = mdParser.parse(content) || schema.nodes.doc.createAndFill()!
      const state = EditorState.create({
        schema,
        doc,
        plugins: view.state.plugins
      })
      isInternalChangeRef.current = true
      view.updateState(state)
      isInternalChangeRef.current = false

      if (onTocChangeRef.current) {
        const toc = extractToc(doc)
        onTocChangeRef.current(toc)
      }
    } catch {
      // If parsing fails, don't update
    }
  }, [content])

  return (
    <div
      ref={editorRef}
      className="ProseMirror-editor"
      style={{ outline: 'none', minHeight: '100%' }}
    />
  )
}

function extractToc(doc: ReturnType<typeof schema.nodeFromJSON>): TocEntry[] {
  const headings: TocEntry[] = []
  let position = 0

  doc.descendants((node) => {
    if (node.type.name === 'heading') {
      const text = node.textContent || ''
      const anchor = text
        .toLowerCase()
        .replace(/[^\w一-鿿\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `heading-${position}`

      headings.push({
        level: node.attrs.level,
        text,
        anchor,
        position: position++
      })
    }
    return true
  })

  return headings
}

// Re-export for external use
export { serializeToMarkdown } from './markdownSerializer'
export { schema } from './schema'
