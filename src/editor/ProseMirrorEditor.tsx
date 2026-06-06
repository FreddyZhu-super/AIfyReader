import React, { useRef, useEffect, useCallback } from 'react'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema } from './schema'
import { buildKeymap } from './plugins/keymap'
import { buildInputRules } from './plugins/inputRules'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { MarkdownParser } from '../parser/markdownParser'

interface ProseMirrorEditorProps {
  content: string
  editable?: boolean
  onChange?: (html: string) => void
  onSelectionChange?: (line: number, col: number) => void
  parser?: MarkdownParser
}

export function ProseMirrorEditor({
  content,
  editable = true,
  onChange,
  onSelectionChange,
  parser
}: ProseMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Create the ProseMirror state
    const state = EditorState.create({
      schema,
      plugins: [
        history(),
        keymap(buildKeymap(schema)),
        keymap(baseKeymap),
        buildInputRules(schema),
        // Selection change listener
        keymap({
          // Track cursor movement
        })
      ]
    })

    // Create the editor view
    const view = new EditorView(editorRef.current, {
      state,
      editable: () => editable,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr)
        view.updateState(newState)

        if (onChange && tr.docChanged) {
          const html = getHtmlContent(view)
          onChange(html)
        }

        if (onSelectionChange && tr.selectionSet) {
          const { from } = view.state.selection
          const doc = view.state.doc
          const line = doc ? doc.resolve(from).parentOffset : 0
          const col = from - (doc ? doc.resolve(from).start() : 0)
          onSelectionChange(line, col)
        }
      }
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, []) // Only mount once

  // Update editable state
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.setProps({
        editable: () => editable
      })
    }
  }, [editable])

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current || !parser) return

    try {
      const parsed = parser.parse(content)
      // In real implementation: use prosemirror-markdown to parse
      // For now, we set HTML directly
      const { EditorState } = require('prosemirror-state')
      // TODO: use proper PM → Markdown parsing
    } catch {
      // Content might not be parsable yet
    }
  }, [content, parser])

  return (
    <div
      ref={editorRef}
      className="ProseMirror-editor"
      style={{ outline: 'none', minHeight: '100%' }}
    />
  )
}

function getHtmlContent(view: EditorView): string {
  // Serialize ProseMirror doc to HTML
  const fragment = view.dom
  return fragment.innerHTML
}

// Helper to set content programmatically
export function setEditorContent(view: EditorView, html: string) {
  const { EditorState } = require('prosemirror-state')
  // TODO: parse HTML to ProseMirror nodes
}
